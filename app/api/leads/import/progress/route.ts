/**
 * PROGRESS TRACKING API ENDPOINT
 * 
 * Server-Sent Events (SSE) endpoint for real-time import progress
 * GET /api/leads/import/progress?jobId=xxx
 */

import { NextRequest, NextResponse } from 'next/server';
import { ProgressManager } from '@/modules/leads/utils/progressTracking';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const jobId = searchParams.get('jobId');

  if (!jobId) {
    return NextResponse.json(
      { error: 'jobId parameter is required' },
      { status: 400 }
    );
  }

  // Create SSE response
  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();

      // Send initial connection message
      const initialData = `data: ${JSON.stringify({
        type: 'connected',
        jobId,
        timestamp: Date.now()
      })}\n\n`;
      controller.enqueue(encoder.encode(initialData));

      // Set up interval to check job status
      const intervalId = setInterval(() => {
        try {
          const job = ProgressManager.getJob(jobId);
          
          if (!job) {
            // Job not found - send error and close
            const errorData = `data: ${JSON.stringify({
              type: 'error',
              error: 'Job not found',
              timestamp: Date.now()
            })}\n\n`;
            controller.enqueue(encoder.encode(errorData));
            clearInterval(intervalId);
            controller.close();
            return;
          }

          // Send progress update
          const progressData = `data: ${JSON.stringify({
            type: 'progress',
            jobId: job.jobId,
            status: job.status,
            totalProgress: job.totalProgress,
            currentPhase: job.currentPhase,
            metrics: job.metrics,
            timestamp: job.lastUpdate,
            canCancel: job.canCancel
          })}\n\n`;
          controller.enqueue(encoder.encode(progressData));

          // Close connection if job is finished
          if (['completed', 'failed', 'canceled'].includes(job.status)) {
            clearInterval(intervalId);
            setTimeout(() => controller.close(), 1000); // Give client time to process final message
          }
        } catch (error) {
          console.error('Error in progress stream:', error);
          clearInterval(intervalId);
          controller.close();
        }
      }, 500); // Update every 500ms

      // Clean up on client disconnect
      request.signal.addEventListener('abort', () => {
        clearInterval(intervalId);
        controller.close();
      });
    }
  });

  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET',
      'Access-Control-Allow-Headers': 'Cache-Control'
    }
  });
}

// Cancel job endpoint
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const jobId = searchParams.get('jobId');

    if (!jobId) {
      return NextResponse.json(
        { error: 'jobId parameter is required' },
        { status: 400 }
      );
    }

    const success = ProgressManager.cancelJob(jobId);
    
    if (!success) {
      return NextResponse.json(
        { error: 'Job not found or cannot be canceled' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Job canceled successfully'
    });

  } catch (error) {
    console.error('Error canceling job:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}