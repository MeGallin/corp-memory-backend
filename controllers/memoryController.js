import asyncHandler from 'express-async-handler';
import Memories from '../models/memoriesModel.js';
import User from '../models/userModel.js';
import MemoryImages from '../models/memoryImageModel.js';

import cron from 'node-cron';
import moment from 'moment';
import nodemailer from 'nodemailer';

// @description: Get All the Memories
// @route: GET /api/memories
// @access: Private
const getAllMemories = asyncHandler(async (req, res) => {
  const memories = await Memories.find({ user: req.user._id }).sort({
    createdAt: -1,
  });

  const user = await User.findById(req.user._id);

  memories.filter((memory) => {
    // NOTES: setTimeout then fire a function
    if (
      moment(new Date()).diff(moment(memory?.dueDate), 'seconds') >
        Number(-604850) &&
      memory?.setDueDate &&
      !memory?.isComplete &&
      !memory?.hasSentSevenDayReminder
    ) {
      // REF https://crontab.guru/
      cron.schedule(`30 * * * *`, async () => {
        // Emailer here
        // create reusable transporter object using the default SMTP transport
        let transporter = nodemailer.createTransport({
          host: process.env.MAILER_HOST,
          port: 587,
          secure: false, // true for 465, false for other ports
          auth: {
            user: process.env.MAILER_USER,
            pass: process.env.MAILER_PW,
          },
          tls: {
            rejectUnauthorized: false,
          },
        });

        // send mail with defined transport object
        let info = await transporter.sendMail({
          from: '"Your Corporate Memory" <info@yourcorporatememory.com>', // sender address
          to: `${user.email}`, // list of receivers
          bcc: 'me@garyallin.uk',
          subject: 'Your Corporate Memory Reminder', // Subject line
          text: 'Your Corporate Memory Reminder', // plain text body
          html: `
          <h1>Hi ${user.name}</h1>
      <p>You have a memory due within the next seven (7) days.</p>
      <h3>The title is: <span style="color: orange;"> ${memory.title}</span> </h3>
      <p>The task is due on ${memory.dueDate}</p>
      <p>Please log into <a href="http://www.yourcorporatememory.com" id='link'>YOUR ACCOUNT</a> to see the reminder</p>
      <p>Thank you</p>
      <h3>Your Corporate Memory management</h3> 
          
       
      `, // html body
        });

        console.log('Message sent: %s', info.messageId);
        // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>

        // Preview only available when sending through an Ethereal account
        console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
        // Preview URL: https://ethereal.email/message/WaQKMgKddxQDoou...

        await Memories.findByIdAndUpdate(
          memory._id.toString(),
          { hasSentSevenDayReminder: true },
          { new: true },
        );
      });
    }
  });

  res.status(200).json(memories);
});
// @description: Create a Memory
// @route: POST /api/memories
// @access: Private
const createMemory = asyncHandler(async (req, res) => {
  if (!req.body.memory) {
    res.status(400);
    throw new Error('No message included');
  }

  if (req.body.tags.length > 0) {
    const tag = [
      {
        tagName: req.body.tags,
      },
    ];
    const memory = await Memories.create({
      title: req.body.title,
      memory: req.body.memory,
      setDueDate: req.body.setDueDate,
      dueDate: req.body.dueDate,
      priority: req.body.priority,
      isComplete: req.body.isComplete,
      hasSentSevenDayReminder: false,
      hasSentOneDayReminder: false,
      user: req.user._id,
      tags: tag,
    });

    res.status(200).json(memory);
  } else {
    const memory = await Memories.create({
      title: req.body.title,
      memory: req.body.memory,
      setDueDate: req.body.setDueDate,
      dueDate: req.body.dueDate,
      priority: req.body.priority,
      isComplete: req.body.isComplete,
      hasSentSevenDayReminder: false,
      hasSentOneDayReminder: false,
      user: req.user._id,
    });

    res.status(200).json(memory);
  }
});
// @description: Update a Memory
// @route: PUT /api/memory/:id
// @access: Private
const updateMemory = asyncHandler(async (req, res) => {
  const memory = await Memories.findById(req.params.id);

  if (!memory) {
    res.status(400);
    throw new Error('Memory not found');
  }

  const user = await User.findById(req.user._id);
  // check for logged in user
  if (!user) {
    res.status(401);
    throw new Error('User not found');
  }
  if (memory.user.toString() !== user.id) {
    res.status(401);
    throw new Error('User not authorised');
  }

  const tags = req.body.tags;
  const updatedData = {
    title: req.body.title,
    memory: req.body.memory,
    priority: req.body.priority,
    setDueDate: req.body.setDueDate,
    dueDate: req.body.dueDate,
    isComplete: req.body.isComplete,
    tags: tags,
  };

  const undatedMemory = await Memories.findByIdAndUpdate(
    req.params.id,
    updatedData,
    { new: true },
  );

  res.status(200).json(undatedMemory);
});
// @description: Delete a Memory
// @route: DELETE /api/memory/:id
// @access: Private
const deleteMemory = asyncHandler(async (req, res) => {
  const memory = await Memories.findById(req.params.id);
  if (!memory) {
    res.status(400);
    throw new Error('Memory not found');
  }
  const user = await User.findById(req.user._id);
  // check for logged in user
  if (!user) {
    res.status(401);
    throw new Error('User not found');
  }
  if (memory.user.toString() !== user.id) {
    res.status(401);
    throw new Error('User not authorised');
  }
  await memory.remove();
  res.status(200).json({ id: `Memory ${req.params.id} deleted` });
});

// @description: Delete a Memory TAG
// @route: DELETE /api/memory/tag:id
// @access: Private
const deleteMemoryTag = asyncHandler(async (req, res) => {
  const memory = await Memories.findById(req.params.id);

  if (!memory) {
    res.status(400);
    throw new Error('Memory not found');
  }
  const user = await User.findById(req.user._id);
  // check for logged in user
  if (!user) {
    res.status(401);
    throw new Error('User not found');
  }
  if (memory.user.toString() !== user.id) {
    res.status(401);
    throw new Error('User not authorised');
  }

  // Remove object for array
  memory.tags.shift();
  await memory.save();
  res.status(200).json(memory);
});

// @description: Delete a Memory Image
// @route: DELETE /api/memory-image/delete/:id
// @access: Private
const deleteMemoryImage = asyncHandler(async (req, res) => {
  // Find a memory
  const memory = await Memories.findById(req.params.id);

  console.log(memory);

  if (memory) {
    // Associate it with memory image
    const image = await MemoryImages.findOne({
      cloudinaryId: memory.cloudinaryId,
    });
    await image.remove();

    const tags = req.body.tags;
    const updatedData = {
      title: req.body.title,
      memory: req.body.memory,
      priority: req.body.priority,
      setDueDate: req.body.setDueDate,
      dueDate: req.body.dueDate,
      isComplete: req.body.isComplete,
      tags: tags,
      cloudinaryId: null,
      memoryImage: null,
    };

    const undatedMemory = await Memories.findByIdAndUpdate(
      req.params.id,
      updatedData,
      { new: true },
    );

    res.status(200).json(undatedMemory);

    res.status(200).json({ id: `Memory ${req.params.id} deleted` });
  }

  // if (!memory) {
  //   res.status(400);
  //   throw new Error('Memory not found');
  // }
  // const user = await User.findById(req.user._id);
  // // check for logged in user
  // if (!user) {
  //   res.status(401);
  //   throw new Error('User not found');
  // }
  // if (memory.user.toString() !== user.id) {
  //   res.status(401);
  //   throw new Error('User not authorised');
  // }
  // await memory.remove();
  // res.status(200).json({ id: `Memory ${req.params.id} deleted` });
});

export {
  getAllMemories,
  createMemory,
  updateMemory,
  deleteMemory,
  deleteMemoryTag,
  deleteMemoryImage,
};
