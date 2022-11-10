import asyncHandler from 'express-async-handler';
import Memories from '../models/memoriesModel.js';
import User from '../models/userModel.js';

// @description: Get All the Users and Memories
// @route: GET /api/admin/user-memories
// @access: Admin and Private
const getAllUsersMemories = asyncHandler(async (req, res) => {
  const memories = await Memories.find({});
  const users = await User.find({});

  const all = [...memories, ...users];
  res.status(200).json(all);
});

// @description: Update isSuspended to true/false
// @route: PUT admin/user/:id
// @access: Private/Admin
const updateIsSuspended = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (user) {
    user.isSuspended = req.body.isSuspended;
    const updateIsSuspended = await user.save();
    res.json(updateIsSuspended);
  } else {
    res.status(404);
    throw new Error('Order not found');
  }
});

export { getAllUsersMemories, updateIsSuspended };
