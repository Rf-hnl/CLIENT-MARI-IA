import { NextRequest, NextResponse } from 'next/server';
import type { Firestore, DocumentReference } from 'firebase-admin/firestore';
import { adminDb } from '@/lib/firebase/admin';

type DocumentDataWithSubcollections = Record<string, unknown> & {
  _subcollections?: NestedCollectionData;
};

type NestedCollectionData = {
  [collectionId: string]: {
    [docId: string]: DocumentDataWithSubcollections;
  };
};

async function getAllCollectionsAndDocs(
  db: Firestore,
  parentRef: DocumentReference | null = null,
  counts: { totalDocuments: number; collectionCounts: Record<string, number> }
): Promise<NestedCollectionData> {
  const collections = parentRef ? await parentRef.listCollections() : await db.listCollections();
  const result: NestedCollectionData = {};

  for (const collection of collections) {
    const snapshot = await collection.get();
    const numDocs = snapshot.docs.length;
    console.log(`Collection: ${collection.id}, Documents found: ${numDocs}`);

    // Update counts with full path
    const currentCollectionPath = parentRef ? `${parentRef.path}/${collection.id}` : collection.id;
    counts.totalDocuments += numDocs;
    counts.collectionCounts[currentCollectionPath] = (counts.collectionCounts[currentCollectionPath] || 0) + numDocs;

    result[collection.id] = {}; // Initialize the collection in the result

    for (const doc of snapshot.docs) {
      const docData = doc.data() as Record<string, any>; // Still need to cast for flexible access
      // Recursively get subcollections for this document
      const subcollectionsData = await getAllCollectionsAndDocs(db, doc.ref, counts);

      if (Object.keys(subcollectionsData).length > 0) {
        result[collection.id][doc.id] = {
          _data: docData,
          _subcollections: subcollectionsData,
        };
      } else {
        result[collection.id][doc.id] = {
          _data: docData,
        };
      }
    }
  }
  return result;
}

export async function GET(_request: NextRequest) {
  try {
    const counts = { totalDocuments: 0, collectionCounts: {} as Record<string, number> };
    const nestedData = await getAllCollectionsAndDocs(adminDb, null, counts); // Call with null for parentRef
    
    // console.log(nestedData); // This can be very large, uncomment for full dump inspection
    return NextResponse.json({ 
      success: true, 
      data: nestedData, // Return the nested data
      totalDocuments: counts.totalDocuments, 
      collectionCounts: counts.collectionCounts, 
      message: "Database analysis complete. Check server logs for collection details." 
    });
  } catch (error) {
    console.error("Error during database analysis:", error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
    }, { status: 500 });
  }
}
