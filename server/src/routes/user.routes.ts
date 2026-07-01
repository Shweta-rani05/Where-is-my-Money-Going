import { Router } from 'express';
import {
  updateProfile,
  changePassword,
  deleteAccount
} from '../controllers/user.controller';
import {
  profileUpdateValidator,
  passwordChangeValidator
} from '../validators/user.validators';
import { protect } from '../middlewares/auth.middleware';

const router = Router();

router.use(protect);

router.put('/profile', profileUpdateValidator, updateProfile);
router.put('/password', passwordChangeValidator, changePassword);
router.delete('/account', deleteAccount);

export default router;
