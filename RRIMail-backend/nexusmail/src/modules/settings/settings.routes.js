const express = require('express');
const router = express.Router();
const ctrl = require('./settings.controller');
const authMiddleware = require('../../middlewares/auth.middleware');
const roleMiddleware = require('../../middlewares/role.middleware');
const validate = require('../../middlewares/validate.middleware');
const {
  createMailTypeSchema,
  updateMailTypeSchema,
  createMailCategorySchema,
  updateMailCategorySchema,
  updateSystemConfigSchema,
  idParamSchema,
  auditLogQuerySchema,
} = require('./settings.validation');
const { ROLES } = require('../../utils/constants');

router.use(authMiddleware);

// ── Mail Types ──────────────────────────────────────────────────────────────
router.get('/mail-types', ctrl.getAllMailTypes);
router.get('/mail-types/:id', validate(idParamSchema), ctrl.getMailTypeById);
router.post('/mail-types', roleMiddleware(ROLES.ADMIN), validate(createMailTypeSchema), ctrl.createMailType);
router.put('/mail-types/:id', roleMiddleware(ROLES.ADMIN), validate(updateMailTypeSchema), ctrl.updateMailType);
router.delete('/mail-types/:id', roleMiddleware(ROLES.ADMIN), validate(idParamSchema), ctrl.deleteMailType);

// ── Mail Categories ──────────────────────────────────────────────────────────
router.get('/mail-categories', ctrl.getAllMailCategories);
router.get('/mail-categories/:id', validate(idParamSchema), ctrl.getMailCategoryById);
router.post('/mail-categories', roleMiddleware(ROLES.ADMIN), validate(createMailCategorySchema), ctrl.createMailCategory);
router.put('/mail-categories/:id', roleMiddleware(ROLES.ADMIN), validate(updateMailCategorySchema), ctrl.updateMailCategory);
router.delete('/mail-categories/:id', roleMiddleware(ROLES.ADMIN), validate(idParamSchema), ctrl.deleteMailCategory);

// ── System Config ────────────────────────────────────────────────────────────
router.get('/config', ctrl.getSystemConfig);
router.put('/config', roleMiddleware(ROLES.ADMIN), validate(updateSystemConfigSchema), ctrl.updateSystemConfig);

// ── Audit Logs ───────────────────────────────────────────────────────────────
router.get('/audit-logs', roleMiddleware(ROLES.ADMIN), validate(auditLogQuerySchema), ctrl.getAuditLogs);

module.exports = router;
