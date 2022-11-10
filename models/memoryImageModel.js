import mongoose from 'mongoose';

const memoryImageSchema = mongoose.Schema(
  {
    id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Memories',
    },
    title: {
      type: String,
    },
    avatar: {
      type: String,
    },
    cloudinaryId: {
      type: String,
    },
  },
  {
    timestamps: true,
  },
);

const MemoryImages = mongoose.model('MemoryImages', memoryImageSchema);

export default MemoryImages;
