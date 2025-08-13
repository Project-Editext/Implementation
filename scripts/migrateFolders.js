import mongoose from 'mongoose';
import { connectToDB } from '@/lib/mongo';
import Folder from '@/models/Folder';
import User from '@/models/User';

async function migrateFolders() {
  try {
    await connectToDB();
    console.log('✅ Connected to DB');

    // Fetch all folders
    const folders = await Folder.find({});
    console.log(`Found ${folders.length} folders`);

    let createdUsers = 0;

    for (const folder of folders) {
      if (!folder.userId) {
        console.warn(`Folder ${folder._id} has no userId, skipping`);
        continue;
      }

      // Check if User exists with this clerkId
      let user = await User.findOne({ clerkId: folder.userId.toString() });

      if (!user) {
        // Create new User document using folder.userId as clerkId
        user = await User.create({ clerkId: folder.userId.toString() });
        createdUsers++;
        console.log(`Created new User for clerkId ${user.clerkId}`);
      }

      // Update folder to reference the new User ObjectId
      folder.userId = user._id;
      await folder.save();
    }

    console.log(`Migration complete. Created ${createdUsers} new Users.`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

migrateFolders();
