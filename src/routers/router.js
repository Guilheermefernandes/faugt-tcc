const express = require('express');
const router = express.Router();

const authController = require('../controller/authController');
const userController = require('../controller/userController');
const responsibleController = require('../controller/responsibleController');
const elderlyController = require('../controller/elderlyController');
const adController = require('../controller/adController');

const { passport } = require('../config/passport');
const { session } = require('passport');
const { verificationPermission } = require('../middleware/permission');
const caregiverController = require('../controller/caregiverController');

router.get('/ping', (req, res) => {
    res.json({ response: 'pong' });
});

router.post('/signup', authController.signup);
router.post('/signin', authController.signin);

router.get('/me/user', 
    passport.authenticate('jwt', {session: false}),
    userController.getUser    
);

router.get('/responsibles', 
    passport.authenticate('jwt', {session: false}),
    responsibleController.getResponsibles
);
router.post('/associate/responsible',
    passport.authenticate('jwt', {session: false}),
    elderlyController.associateResponsible
);
router.get('/list/caregivers',
    passport.authenticate('jwt', {session: false}),
    verificationPermission(2),
    adController.caregiverList
);
router.post('/like', 
    passport.authenticate('jwt', {session: false}),
    verificationPermission(2),
    elderlyController.like    
);
router.post('/association/caregiver',
    passport.authenticate('jwt', {session: false}),
    verificationPermission(2),
    adController.associationCaregiverAndElderly
);
router.post('/send/association/responsible',
    passport.authenticate('jwt', {session: false}),
    caregiverController.requestForElderly
);
router.post('/send/association/caregiver',
    passport.authenticate('jwt', {session: false}),
    responsibleController.requestForCaregiver
);


module.exports = router;