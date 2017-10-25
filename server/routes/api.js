/**
 * Created by Romain on 22/03/2017.
 */

module.exports = function(passport) {
  const express = require('express');
  const router = express.Router();
  var jwt = require('express-jwt');
  var auth = jwt({
    secret: 'CALM_SECRET',
    userProperty: 'payload'
  });

  var ctrlProfile = require('../controllers/profile');
  var ctrlAuth = require('../controllers/authentication');

  var User = require('../models/user');
  var Doctor = require('../models/doctor');
  var Patient = require('../models/patient');
  var Address = require('../models/address');
  var Post = require('../models/post');
  var Autorisation = require('../models/autorisation');

  /* GET api listing. */
  router.get('/', function(req, res) {
    res.send("<h1>API Home</h1> <br>" +
      "<a href='/api/users'>Show Users</a><br>" +
      "<a href='/api/doctors'>Show Doctors</a><br>" +
      "<a href='/api/patients'>Show Patients</a><br>" +
      "<a href='/api/addresses'>Show Addresses</a><br>" +
      "<a href='/api/post'>Show Posts</a><br>" +
      "<a href='/'>Return to the website</a>");
  });

  //get all users
  router.get('/users', auth, function(req, res) {
    User.find({})
      .populate('address')
      .exec(function (err, docs) {
      res.json(docs);
    });
  });

  router.get('/doctors', auth, function(req, res) {
    Doctor.find({})
      .populate({path : 'user_id', populate: {path: 'address'}})
      .exec(function (err, docs) {
      res.json(docs);
    });
  });

  router.get('/patients', auth, function(req, res) {
    Patient.find({})
      .populate('user_id')
      .populate('general_doctor')
      .exec(function (err, docs) {
        res.json(docs);
      });
  });


  router.get('/patients/:id', auth, function(req, res) {

    Patient
      .findOne({user_id: req.params.id})
      // Find the right patient
      .populate({
        path: 'user_id'
      })
      // Find the informations about his doctor
      .populate({
        path: 'general_doctor',
        populate: {path : 'user_id', populate: {path: 'address'}}
      })
      .exec(function (err, docs) {
        res.json(docs);
      });
  });

  // Find the patients of a doctor
  router.get('/patientsdoctor/:doctor', auth, function(req, res) {

    Patient.find({})
      .populate({
        path: 'general_doctor',
        match: { user_id: req.params.doctor}
      })
      .populate({
        path: 'user_id'
      })
      .exec(function (err, docs) {
      res.json(docs);
    });
  });

  router.get('/addresses', auth, function(req, res) {
    Address.find({})
      .exec(function (err, docs) {
        res.json(docs);
      });
  });

  router.get('/addresses/:id', auth, function(req, res) {
    if (req.params.id) {
      Address.findById(req.params.id)
        .exec(function(err, user) {
        res.json(user);
      });
    }
  });

  //get one user by his id.
  router.get('/users/:id', auth, function(req, res) {
    if (req.params.id) {
      User.findOne({ _id: req.params.id }, function (err, docs) {
        res.json(docs);
      });
    }
  });

  // Profile page
  router.get('/profile', auth, ctrlProfile.profileRead);

  // Authentication
  router.post('/register', ctrlAuth.register);
  router.post('/login', ctrlAuth.login);

  // Delete a user
  router.delete('/users/:id', auth, function (req, res, next) {
    deleteCollectionsRelated(req);

    User.remove({ _id: req.params.id}, function (err, docs) {
      if (err) return (err);
      else {
        // deleteUser!
        res.sendStatus(200);
      }
    });
  });

  function deleteCollectionsRelated(req) {
    Patient.remove({user_id: req.params.id}, function (err) {
      if (err) return (err);
    });
    Doctor.remove({user_id: req.params.id}, function (err) {
      if (err) return (err);
    });
  }

  // delete address with id
  router.delete('/addresses/:id', auth, function (req, res, next) {
    Address.remove({ _id: req.params.id}, function (err) {
      if (err) return err;
      else {
        // Adress deleted
        res.sendStatus(200);
      }
    });
  });

  // Add a general doctor to a patient
  router.put('/patient/:id', auth, function (req, res, next) {

    // Add the patient in the patients list
    Doctor.findByIdAndUpdate(req.body._id, { $push: { patients: req.params.id }}, { new: true }, function (err, doctor) {
      if (err) return handleError(err);
    });

    // Add the doctor in the general_doctor field
    Patient.findByIdAndUpdate(req.params.id, { $set: { general_doctor: req.body._id }}, { new: true }, function (err, patient) {
      if (err) return handleError(err);
      if (patient) {
        res.sendStatus(200);
      }
    });
  });

  // Save the new post
  router.post('/post', auth, function (req, res, next) {
    var post = new Post();
    post.sender = req.body.sender;
    post.receiver = req.body.receiver;
    post.text = req.body.text;
    post.type =req.body.type;
    post.save(function(err) {
      res.json(err);
    });

  });

  // Get the posts for a given user
  router.get('/post/:sender/:receiver', auth, function (req, res, next) {
    Post.find({sender: req.params.sender, receiver: req.params.receiver})
      .exec(function (err, docs) {
        res.json(docs);
      });
  });

  // Get all posts
  router.get('/post', auth, function (req, res, next) {
    Post.find({})
      .populate('doctor')
      .populate('patient')
      .exec(function (err, docs) {
        res.json(docs);
      });
  });

  //Get the autorisations for a user
  router.get('/autorisation/:id', auth, function (req, res, next) {
    Autorisation.find({user: req.params.id})
      .populate('observer')
      .exec(function (err, docs) {
        res.json(docs);
      });
  });

  //add an autorisation
  router.put('/autorisation/', auth, function (req, res, next){
    var autorisation = new Autorisation();
    autorisation.user = req.body.user;
    autorisation.observer = req.body.observer;
    // a completer
    autorisation.save(function(err){
      if(err != null){
        console.log(err);
      }
    });
  });

  return router;

};




