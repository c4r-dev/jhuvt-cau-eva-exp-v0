import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '../../../lib/mongodb';
import mongoose from 'mongoose';

// Define the causalLevel schema
const causalLevelSchema = new mongoose.Schema({
  responses: [{
    questionIndex: {
      type: Number,
      required: true
    },
    selectedAnswer: {
      type: String,
      required: true
    },
    reasoning: {
      type: String,
      required: true
    },
    isCorrect: {
      type: Boolean,
      required: true
    },
    question: {
      Question: String,
      Example: String,
      'Study Description': String,
      Methodology1: String,
      Methodology2: String,
      Results1: String,
      Results2: String,
      'Level of Explanation': String
    }
  }],
  timestamp: {
    type: Date,
    default: Date.now
  }
});

// Create or get the model
const CausalLevel = mongoose.models.causalLevel || mongoose.model('causalLevel', causalLevelSchema);

export async function POST(request: NextRequest) {
  try {
    if (!process.env.MONGODB_URI) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 503 }
      );
    }
    
    await dbConnect();
    
    const body = await request.json();
    
    // Check if this is causalLevel submission
    if (body.type === 'causalLevel' && body.responses) {
      const causalSubmission = new CausalLevel({ responses: body.responses });
      await causalSubmission.save();
      return NextResponse.json({ success: true, id: causalSubmission._id, collection: 'causalLevel' });
    }
    
    return NextResponse.json(
      { error: 'Invalid submission type' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error saving submission:', error);
    return NextResponse.json(
      { error: 'Failed to save submission' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    if (!process.env.MONGODB_URI) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 503 }
      );
    }
    
    await dbConnect();
    
    // Get the last 15 causalLevel submissions, sorted by timestamp descending
    const causalLevelSubmissions = await CausalLevel
      .find({})
      .sort({ timestamp: -1 })
      .limit(15)
      .lean();
    
    return NextResponse.json({ submissions: causalLevelSubmissions });
  } catch (error) {
    console.error('Error fetching submissions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch submissions' },
      { status: 500 }
    );
  }
}

