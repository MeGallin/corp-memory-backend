import asyncHandler from 'express-async-handler';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import User from '../models/userModel.js';
import ProfileImages from '../models/profileImageModel.js';
import nodemailer from 'nodemailer';

// @description: Register new user
// @route: POST /api/users
// @access: Public
const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password, confirmPassword } = req.body;

  if (
    !name ||
    !email ||
    !password ||
    (!confirmPassword && password === confirmPassword)
  ) {
    res.status(400);
    throw new Error('Please add all fields');
  }
  // Check if user already exists
  const userExists = await User.findOne({ email });
  if (userExists) {
    res.status(400);
    throw new Error('That email is already in use.');
  }
  // hash the Password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);
  // Create the user
  const user = await User.create({
    name,
    email,
    password: hashedPassword,
    profileImage: '/assets/images/sample.png',
    cloudinaryId: '12345',
  });

  if (user) {
    res.status(201).json({
      _id: user.id,
      name: user.name,
      email: user.email,
      profileImage: user.profileImage,
      cloudinaryId: user.cloudinaryId,
      token: generateToken(user._id, user.email),
    });

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

    const link = `${
      process.env.MAILER_LOCAL_URL
    }api/confirm/token=${generateToken(user._id)}`;

    // send mail with defined transport object
    let info = await transporter.sendMail({
      from: '"Your Corporate Memory" <info@yourcorporatememory.com>', // sender address
      to: `${user.email}`, // list of receivers
      bcc: 'me@garyallin.uk',
      subject: 'Your Corporate Memory Registration', // Subject line
      text: 'Your Corporate Memory Registration', // plain text body
      html: `
      <h1>Hi ${user.name}</h1>
      <p>You have successfully registered with Your Corporate Memory</p>
      <p>Please Click on the link to verify your email.</p>
      <br>
      <h4>Please note, in order to get full functionality you must confirm your mail address with the link below.</h4>
      <p><a href=${link} id='link'>Click here to verify</a></p>
      <p>Thank you Your Corporate Memory management</p>
          
       
      `, // html body
    });

    console.log('Message sent: %s', info.messageId);
    // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>

    // Preview only available when sending through an Ethereal account
    console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
    // Preview URL: https://ethereal.email/message/WaQKMgKddxQDoou...
  } else {
    res.status(400);
    throw new Error('Invalid user data');
  }
});
// @description: Authenticate a user
// @route: POST /api/users/login
// @access: Public
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  // Check for user email first
  const user = await User.findOne({ email });

  if (user && (await bcrypt.compare(password, user.password))) {
    res.status(201).json({
      _id: user.id,
      name: user.name,
      email: user.email,
      token: generateToken(user._id, user.email),
    });
  } else {
    res.status(400);
    throw new Error('Invalid credentials');
  }
});
// @description: Update a USER
// @route: PUT /api/user/:id
// @access: Private
const updateUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  const profileImage = await ProfileImages.find({ user: req.params.id });
  const profileImgLength = profileImage.length - 1;

  if (user) {
    // hash the Password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(req.body.password, salt);

    user.name = req.body.name || user.name;
    user.email = req.body.email || user.email;
    user.profileImage = profileImage[profileImgLength].avatar;
    user.cloudinaryId = profileImage[profileImgLength].cloudinaryId;

    if (req.body.password) {
      user.password = hashedPassword;
    }

    const updatedUser = await user.save();

    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      isAdmin: updatedUser.isAdmin,
      isSuspended: updatedUser.isSuspended,
      profileImage: updatedUser.profileImage,
      cloudinaryId: updatedUser.cloudinaryId,
      token: generateToken(updatedUser._id),
    });
  } else {
    res.status(404);
    throw new Error('No user found');
  }
});
// @description: Get user data of logged in in user
// @route: GET /api/users/user
// @access: PRIVATE
const getMyUserData = asyncHandler(async (req, res) => {
  const {
    _id,
    name,
    email,
    isAdmin,
    isConfirmed,
    isSuspended,
    profileImage,
    cloudinaryId,
  } = await User.findById(req.user.id);
  res.status(200).json({
    id: _id,
    name,
    email,
    isAdmin,
    isConfirmed,
    isSuspended,
    profileImage,
    cloudinaryId,
  });
});

// @description:  User FORGOTTEN PASSWORD send EMAIL and  save TOKEN
// @route: POST /api/user-forgot-password
// @access: PUBLIC
const userForgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email: email });

  if (user) {
    const token = generateToken(user._id, { expiresIn: '360s' });
    const link = `${process.env.RESET_PASSWORD_LOCAL_URL}reset-password/${token}`;
    user.resetPasswordToken = token;
    await user.save();
    // Email with magic link here

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
      subject: 'Your Corporate Memory password re-set request', // Subject line
      text: 'Your Corporate Memory password re-set request', // plain text body
      html: `
      <h1>Hi ${user.name}</h1>
      <p>You can reset your password by clicking the link provided below</p>
   
      <p><a href=${link} id='link'>Click here to reset your password</a></p>
      <h3 style="color: red;">PLEASE DELETE THIS EMAIL AFTER YOU HAVE RESET YOUR PASSWORD.</h3>
      <p>Thank you Your Corporate Memory management</p>
          
       
      `, // html body
    });

    console.log('Message sent: %s', info.messageId);
    // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>

    // Preview only available when sending through an Ethereal account
    console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
    // Preview URL: https://ethereal.email/message/WaQKMgKddxQDoou...

    res.status(200).json('Your password was successfully reset');
  } else {
    res.status(409);
    throw new Error('Sorry, no match could be found for that email.');
  }
});

// Generate a secret token for the user
const generateToken = (id, email) => {
  return jwt.sign({ id, email }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

// @description: UPdate User FORGOTTEN PASSWORD
// @route: PUT /api/user-update-forgotten-password
// @access: PUBLIC

const userUpdateForgottenPassword = asyncHandler(async (req, res) => {
  const { resetPasswordToken, password } = req.body;

  // hash the Password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  const user = await User.findOne({
    resetPasswordToken: resetPasswordToken,
  });
  if (user) {
    if (password) {
      user.password = hashedPassword;
    }
    await user.save();
    res.status(201).json('Your password was SUCCESSFULLY updated.');
  } else {
    res.status(404);
    throw new Error('No user found');
  }
});

export {
  registerUser,
  loginUser,
  getMyUserData,
  updateUser,
  userForgotPassword,
  userUpdateForgottenPassword,
};
