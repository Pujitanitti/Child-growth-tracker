const express = require('express');
const router = express.Router();

const {
  listChildren, getChild, createChild, updateChild, deleteChild, uploadChildPhoto, importChildrenCsv,
} = require('../controllers/childController');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { uploadPhoto, uploadCsv } = require('../middleware/upload');
const { childRules, idParamRule, listQueryRules } = require('../validators/childValidators');

router.use(protect);

router.get('/', listQueryRules, validate, listChildren);
router.post('/import', uploadCsv, importChildrenCsv);
router.post('/', childRules, validate, createChild);
router.get('/:id', idParamRule, validate, getChild);
router.patch('/:id', idParamRule, childRules, validate, updateChild);
router.delete('/:id', idParamRule, validate, deleteChild);
router.post('/:id/photo', idParamRule, validate, uploadPhoto, uploadChildPhoto);

module.exports = router;
