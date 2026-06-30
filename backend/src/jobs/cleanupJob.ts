import cron from 'node-cron';
import { Opportunity } from '../models/Opportunity';
import { MarketplacePost } from '../models/MarketplacePost';
import { RoomPost } from '../models/RoomPost';
import { LostFoundPost } from '../models/LostFoundPost';
import { SupportRequest } from '../models/SupportRequest';
import * as opportunityService from '../services/opportunityService';

export const runCleanup = async (): Promise<void> => {
  console.log('[Cleanup Job] Starting automatic 30-day post cleanup...');
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  // 1. Opportunities: auto-expire and archive
  try {
    const expiredOpps = await Opportunity.find({ createdAt: { $lt: thirtyDaysAgo } });
    console.log(`[Cleanup Job] Found ${expiredOpps.length} expired opportunities to archive/delete.`);
    for (const opp of expiredOpps) {
      try {
        await opportunityService.deleteOpportunity(opp._id.toString());
      } catch (oppErr) {
        console.error(`[Cleanup Job] Failed to delete/archive opportunity ${opp._id}:`, oppErr);
      }
    }
  } catch (err) {
    console.error('[Cleanup Job] Error cleaning up opportunities:', err);
  }

  // 2. Marketplace Posts
  try {
    const res = await MarketplacePost.deleteMany({ createdAt: { $lt: thirtyDaysAgo } });
    console.log(`[Cleanup Job] Deleted ${res.deletedCount} expired marketplace posts.`);
  } catch (err) {
    console.error('[Cleanup Job] Error cleaning up marketplace posts:', err);
  }

  // 3. Room Posts
  try {
    const res = await RoomPost.deleteMany({ createdAt: { $lt: thirtyDaysAgo } });
    console.log(`[Cleanup Job] Deleted ${res.deletedCount} expired room posts.`);
  } catch (err) {
    console.error('[Cleanup Job] Error cleaning up room posts:', err);
  }

  // 4. Lost & Found Posts
  try {
    const res = await LostFoundPost.deleteMany({ createdAt: { $lt: thirtyDaysAgo } });
    console.log(`[Cleanup Job] Deleted ${res.deletedCount} expired lost & found posts.`);
  } catch (err) {
    console.error('[Cleanup Job] Error cleaning up lost & found posts:', err);
  }

  // 5. Support Requests
  try {
    const res = await SupportRequest.deleteMany({ createdAt: { $lt: thirtyDaysAgo } });
    console.log(`[Cleanup Job] Deleted ${res.deletedCount} expired support requests.`);
  } catch (err) {
    console.error('[Cleanup Job] Error cleaning up support requests:', err);
  }

  console.log('[Cleanup Job] Finished automatic post cleanup.');
};

export const startCleanupJob = () => {
  // Run hourly at minute 0
  cron.schedule('0 * * * *', async () => {
    try {
      await runCleanup();
    } catch (err) {
      console.error('[Cleanup Job] Unhandled error during scheduled run:', err);
    }
  });
};
