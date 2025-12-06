import mongoose from 'mongoose';

// Example model structure
const exampleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
exampleSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const Example = mongoose.model('Example', exampleSchema);

export default Example;
