import { Request, Response, NextFunction } from 'express';
import { emailReportService } from '../services/emailReport.service';

/**
 * @route   POST /api/reports/send-email
 * @desc    Generate and send monthly expense report to the authenticated user's email via Resend
 * @access  Private
 */
export const sendEmailReport = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      res.status(401).json({ status: 'fail', message: 'Unauthorized session' });
      return;
    }

    const { month, year } = req.body;

    const parsedMonth = month ? parseInt(month, 10) : undefined;
    const parsedYear = year ? parseInt(year, 10) : undefined;

    if (parsedMonth && (parsedMonth < 1 || parsedMonth > 12)) {
      res.status(400).json({ status: 'fail', message: 'Month must be between 1 and 12' });
      return;
    }

    const result = await emailReportService.sendMonthlyReport({
      userId,
      month: parsedMonth,
      year: parsedYear,
    });

    res.status(200).json({
      status: 'success',
      message: result.simulated
        ? `[Dev Mode] Email report simulated for ${result.recipient}. Add RESEND_API_KEY to send live emails.`
        : `Financial report successfully sent to ${result.recipient}!`,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/reports/preview
 * @desc    Get preview data & HTML template for the requested month
 * @access  Private
 */
export const getReportPreview = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      res.status(401).json({ status: 'fail', message: 'Unauthorized session' });
      return;
    }

    const { month, year } = req.query;
    const parsedMonth = month ? parseInt(month as string, 10) : undefined;
    const parsedYear = year ? parseInt(year as string, 10) : undefined;

    const reportData = await emailReportService.generateMonthlyReportData(
      userId,
      parsedMonth,
      parsedYear
    );
    const html = emailReportService.generateHtmlTemplate(reportData);

    res.status(200).json({
      status: 'success',
      data: {
        reportData,
        html,
      },
    });
  } catch (error) {
    next(error);
  }
};

