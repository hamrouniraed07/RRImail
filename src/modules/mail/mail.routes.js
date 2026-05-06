const express = require('express');
const router = express.Router();
const mailController = require('./mail.controller');
const authMiddleware = require('../../middlewares/auth.middleware');
const roleMiddleware = require('../../middlewares/role.middleware');
const validate = require('../../middlewares/validate.middleware');
const {
  createMailSchema,
  updateStatusSchema,
  assignMailSchema,
  listMailSchema,
  mailIdParamSchema,
  addCommentSchema,
} = require('./mail.validation');
const { ROLES } = require('../../utils/constants');

router.use(authMiddleware);

// Stats
router.get(
  '/stats',
  roleMiddleware(ROLES.ADMIN, ROLES.DIRECTOR),
  mailController.getMailStats
);

// Mail CRUD
router.get('/', validate(listMailSchema), mailController.getAllMails);

router.post(
  '/',
  roleMiddleware(ROLES.SECRETARY, ROLES.ADMIN),
  validate(createMailSchema),
  mailController.createMail
);

router.get(
  '/user/:id',
  roleMiddleware(ROLES.ADMIN, ROLES.DIRECTOR, ROLES.SERVICE_LEAD),
  mailController.getMailsByUser
);

router.get('/:id', validate(mailIdParamSchema), mailController.getMailById);

router.put(
  '/:id/status',
  validate(updateStatusSchema),
  mailController.updateMailStatus
);

router.put(
  '/:id/assign',
  roleMiddleware(ROLES.DIRECTOR, ROLES.ADMIN),
  validate(assignMailSchema),
  mailController.assignMail
);

// Comments
router.post(
  '/:id/comments',
  validate(addCommentSchema),
  mailController.addComment
);

router.get(
  '/:id/comments',
  validate(mailIdParamSchema),
  mailController.getComments
);

module.exports = router;
