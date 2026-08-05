const express = require('express');
const router = express.Router();

const {
  listVaccinations, addVaccination, markCompleted, updateVaccination, deleteVaccination,
} = require('../controllers/vaccinationController');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');
const {
  vaccinationRules, completeRules, childIdParamRule, idParamRule, statusQueryRule,
} = require('../validators/vaccinationValidators');

router.use(protect);

router.get('/children/:childId/vaccinations', childIdParamRule, statusQueryRule, validate, listVaccinations);
router.post('/children/:childId/vaccinations', childIdParamRule, vaccinationRules, validate, addVaccination);

router.patch('/vaccinations/:id/complete', idParamRule, completeRules, validate, markCompleted);
router.patch('/vaccinations/:id', idParamRule, validate, updateVaccination);
router.delete('/vaccinations/:id', idParamRule, validate, deleteVaccination);

module.exports = router;
