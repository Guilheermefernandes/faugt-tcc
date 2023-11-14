const express = require('express');
const router = express.Router();

const authController = require('../controller/authController');
const userController = require('../controller/userController');
const responsibleController = require('../controller/responsibleController');
const elderlyController = require('../controller/elderlyController');
const adController = require('../controller/adController');

const { passport } = require('../config/passport');
const { session, authenticate } = require('passport');
const { verificationPermission } = require('../middleware/permission');
const caregiverController = require('../controller/caregiverController');

//Rotas padrões
router.get('/periods', 
    passport.authenticate('jwt', {session: false}),
    userController.getPeriod
);

router.post('/signup', authController.signup);
router.post('/set/period', 
    passport.authenticate('jwt', {session: false}),
    userController.setPeriod
);
router.post('/signin', authController.signin);
router.post('/admim/signin', 
    authController.admimSignin
);

router.get('/me/user', 
    passport.authenticate('jwt', {session: false}),
    userController.getUser    
);
router.post('/me/user/edit', 
    passport.authenticate('jwt', {session: false}), 
    userController.editUser    
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


router.get('/penddings/responsible', 
    passport.authenticate('jwt', {session: false}),
    responsibleController.getPenddings
);
router.get('/penddings/caregiver', 
    passport.authenticate('jwt', {session: false}),
    caregiverController.getNotificationElderly
);


router.get('/get/elderly', 
    passport.authenticate('jwt', {session: false}),
    userController.getElderly
);
router.get('/get/caregiver', 
    passport.authenticate('jwt', {session: false}),
    userController.getCaregiver
);

router.get('/association/caregiver', 
    passport.authenticate('jwt', {session: false}),
    caregiverController.getAssociationCaregiver
);
router.get('/association/responsible', 
    passport.authenticate('jwt', {session: false}),
    responsibleController.getAssociationResponsible
);


//Desassociation

router.get('/elderly/desassociation',
    passport.authenticate('jwt', {session: false}),
    elderlyController.desassociation
);


//Evaluation
router.post('/evaluation', 
    passport.authenticate('jwt', {session: false}),
    verificationPermission(2),
    elderlyController.endorseCaregiver
);

//Refatorar
router.post('/recovery', 
    userController.recovery
);

router.get('/logo', userController.getLogo);
module.exports = router;