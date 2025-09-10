import mongoose from 'mongoose';

const logSchema = new mongoose.Schema({
  timestamp: {
    type: Date,
    required: true
  },
  service: {
    type: String,
    required: true,
    lowercase: true // Ensures consistency for service names
  },
  microservice: {
    type: String,
    required: false // Optional field
  },
  username: {
    type: String,
    required: true
  },
  action: {
    type: String,
    required: true,
    uppercase: true // Ensures consistency for action names
  },
  details: {
    type: mongoose.Schema.Types.Mixed, // Allows any JSON structure
    required: false
  },
  metadata: {
    ip: String,
    userAgent: String
  },
  processed_at: {
    type: Date,
    required: true
  },
  message_id: {
    type: String,
    required: false,
    sparse: true // Index only documents that have this field
  },
  delivery_tag: {
    type: Number,
    required: false
  }
}, {
  timestamps: true, // Adds createdAt and updatedAt fields
  strict: false // Allows additional fields not specified in the schema
});

// Create indexes for frequently queried fields
logSchema.index({ service: 1 });
logSchema.index({ timestamp: -1 });
logSchema.index({ service: 1, timestamp: -1 });
logSchema.index({ username: 1 });
logSchema.index({ action: 1 });
logSchema.index({ 'details.matchId': 1 }, { sparse: true }); // Index for matchId lookups if needed

const Log = mongoose.model('Log', logSchema, 'user_logs'); // Specify the collection name to match existing data

export default Log;
