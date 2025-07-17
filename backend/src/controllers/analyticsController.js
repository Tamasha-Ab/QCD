import Inspection from '../models/inspectionModel.js';
import Defect from '../models/defectModel.js';
import mongoose from 'mongoose';

// @desc    Get quality metrics
// @route   GET /api/analytics
// @access  Private
export const getQualityMetrics = async (req, res) => {
  try {
    const { startDate, endDate, product } = req.query;

    // Build the query object for filtering inspections and defects
    const query = {};
    if (startDate && endDate) {
      // Validate date parsing - ensure valid dates
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return res.status(400).json({ success: false, error: 'Invalid date format' });
      }

      // Validate that end date is not earlier than start date
      if (end < start) {
        return res.status(400).json({
          success: false,
          error: 'End date cannot be earlier than start date'
        });
      }

      query.date = { $gte: start, $lte: end };
    }
    if (product) {
      if (mongoose.Types.ObjectId.isValid(product)) {
        query.product = new mongoose.Types.ObjectId(product);
      } else {
        return res.status(400).json({ success: false, error: 'Invalid product ID' });
      }
    }

    // Fetch inspections based on query
    const inspections = await Inspection.find(query);

    // Calculate totals
    let totalInspected = 0;
    let totalDefects = 0;
    inspections.forEach(({ totalInspected: ti, defectsFound: df }) => {
      totalInspected += ti;
      totalDefects += df;
    });

    const overallDefectRate = totalInspected > 0 ? (totalDefects / totalInspected) * 100 : 0;

    // Aggregate defects by a specific field (type, severity, etc.)
    const aggregateDefects = async (groupField) => {
      // We use Defect collection with matching filters for product and date
      // Note: If Defect schema does not have product or date, you might need to adjust this
      return Defect.aggregate([
        { $match: query },
        { $group: { _id: `$${groupField}`, count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]);
    };

    const defectsByType = await aggregateDefects('type');
    const defectsBySeverity = await aggregateDefects('severity');

    const defectTrend = await Inspection.aggregate([
      { $match: query },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
          inspectionCount: { $sum: 1 },
          defectCount: { $sum: '$defectsFound' },
          totalInspected: { $sum: '$totalInspected' }
        }
      },
      {
        $project: {
          date: '$_id',
          inspectionCount: 1,
          defectCount: 1,
          totalInspected: 1,
          defectRate: {
            $multiply: [
              { $divide: ['$defectCount', { $cond: [{ $eq: ['$totalInspected', 0] }, 1, '$totalInspected'] }] },
              100
            ]
          },
          _id: 0
        }
      },
      { $sort: { date: 1 } }
    ]);

    const productDefectRates = await Inspection.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$product',
          totalInspected: { $sum: '$totalInspected' },
          totalDefects: { $sum: '$defectsFound' }
        }
      },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'product'
        }
      },
      { $unwind: '$product' },
      {
        $project: {
          productName: '$product.name',
          totalInspected: 1,
          totalDefects: 1,
          defectRate: {
            $multiply: [
              { $divide: ['$totalDefects', { $cond: [{ $eq: ['$totalInspected', 0] }, 1, '$totalInspected'] }] },
              100
            ]
          }
        }
      },
      { $sort: { defectRate: -1 } },
      { $limit: 5 }
    ]);

    const aiDetections = await Defect.find({ ...query, detectedBy: 'ai' }).select('aiConfidence');

    const avgAiConfidence = aiDetections.length
      ? (aiDetections.reduce((sum, d) => sum + d.aiConfidence, 0) / aiDetections.length)
      : 0;

    const inspectorPerformance = await Inspection.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$inspector',
          inspectionCount: { $sum: 1 },
          totalInspected: { $sum: '$totalInspected' },
          totalDefects: { $sum: '$defectsFound' }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'inspector'
        }
      },
      { $unwind: '$inspector' },
      {
        $project: {
          inspectorName: '$inspector.name',
          inspectorDepartment: '$inspector.department',
          inspectionCount: 1,
          totalInspected: 1,
          totalDefects: 1,
          defectRate: {
            $multiply: [
              { $divide: ['$totalDefects', { $cond: [{ $eq: ['$totalInspected', 0] }, 1, '$totalInspected'] }] },
              100
            ]
          },
          averageInspectionSize: { $divide: ['$totalInspected', '$inspectionCount'] }
        }
      },
      { $sort: { inspectionCount: -1 } }
    ]);

    const monthlyTrend = await Inspection.aggregate([
      { $match: query },
      {
        $group: {
          _id: {
            year: { $year: '$date' },
            month: { $month: '$date' }
          },
          inspectionCount: { $sum: 1 },
          defectCount: { $sum: '$defectsFound' },
          totalInspected: { $sum: '$totalInspected' }
        }
      },
      {
        $project: {
          period: {
            $concat: [
              { $toString: '$_id.year' },
              '-',
              { $toString: '$_id.month' }
            ]
          },
          inspectionCount: 1,
          defectCount: 1,
          totalInspected: 1,
          defectRate: {
            $multiply: [
              { $divide: ['$defectCount', { $cond: [{ $eq: ['$totalInspected', 0] }, 1, '$totalInspected'] }] },
              100
            ]
          }
        }
      },
      { $sort: { period: 1 } }
    ]);

    res.status(200).json({
      success: true,
      data: {
        overallMetrics: {
          totalInspections: inspections.length,
          totalItemsInspected: totalInspected,
          totalDefectsFound: totalDefects,
          overallDefectRate: overallDefectRate.toFixed(2)
        },
        defectsByType,
        defectsBySeverity,
        defectTrend,
        productDefectRates,
        inspectorPerformance,
        monthlyTrend,
        aiMetrics: {
          totalAiDetections: aiDetections.length,
          avgAiConfidence: avgAiConfidence.toFixed(2)
        }
      }
    });
  } catch (error) {
    console.error('Error in getQualityMetrics:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Get inspection statistics
// @route   GET /api/analytics/inspections
// @access  Private
export const getInspectionStats = async (req, res) => {
  try {
    const { period } = req.query;
    const now = new Date();
    let dateQuery = {};

    switch (period) {
      case 'day': {
        const startOfDay = new Date(now);
        startOfDay.setHours(0, 0, 0, 0);
        dateQuery.date = { $gte: startOfDay };
        break;
      }
      case 'week': {
        const startOfWeek = new Date(now);
        const day = startOfWeek.getDay();
        startOfWeek.setDate(startOfWeek.getDate() - day);
        startOfWeek.setHours(0, 0, 0, 0);
        dateQuery.date = { $gte: startOfWeek };
        break;
      }
      case 'month': {
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        dateQuery.date = { $gte: startOfMonth };
        break;
      }
      case 'year': {
        const startOfYear = new Date(now.getFullYear(), 0, 1);
        dateQuery.date = { $gte: startOfYear };
        break;
      }
      default: {
        // Default to start of current week
        const defaultStart = new Date(now);
        const day = defaultStart.getDay();
        defaultStart.setDate(defaultStart.getDate() - day);
        defaultStart.setHours(0, 0, 0, 0);
        dateQuery.date = { $gte: defaultStart };
      }
    }

    // Aggregate counts of inspections by status
    const statusCounts = await Inspection.aggregate([
      { $match: dateQuery },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    // Initialize status counts to 0 to avoid undefined keys
    const formattedStatusCounts = {
      pending: 0,
      completed: 0,
      failed: 0
    };

    statusCounts.forEach(({ _id, count }) => {
      if (_id in formattedStatusCounts) {
        formattedStatusCounts[_id] = count;
      } else {
        // Optionally handle unexpected status keys here
      }
    });

    const groupByFormat = period === 'year' ? '%Y-%m' : '%Y-%m-%d';

    // Aggregate daily (or monthly) counts grouped by status
    const dailyCounts = await Inspection.aggregate([
      { $match: dateQuery },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: groupByFormat, date: '$date' } },
            status: '$status'
          },
          count: { $sum: 1 }
        }
      },
      {
        $group: {
          _id: '$_id.date',
          statuses: {
            $push: {
              status: '$_id.status',
              count: '$count'
            }
          },
          totalCount: { $sum: '$count' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.status(200).json({
      success: true,
      data: {
        statusCounts: formattedStatusCounts,
        total: Object.values(formattedStatusCounts).reduce((a, b) => a + b, 0),
        dailyBreakdown: dailyCounts,
        period: period || 'week'
      }
    });
  } catch (error) {
    console.error('Error in getInspectionStats:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};
