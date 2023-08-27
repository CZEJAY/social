"use server";

import { revalidatePath } from "next/cache";
import Thread from "../models/thread.model";
import User from "../models/user.model";
import { connectToDB } from "../mongoose";

interface Params {
  text: string;
  author: string;
  communityId: string | null;
  path: string;
}

export async function createThread({
  text,
  author,
  communityId,
  path,
}: Params) {
  try {
    connectToDB();

    const createdThread = await Thread.create({
      text,
      author,
      community: null,
    });

    //update user model
    await User.findByIdAndUpdate(author, {
      $push: { thread: createdThread._id },
    });

    revalidatePath(path);
  } catch (error: any) {
    throw new Error(`Error creating thread: ${error.message}`);
  }
}

export async function fetchPost(pageNumber = 1, pageSize = 20) {
  connectToDB();
  //calc the number of th post to skip
  const skipAmount = (pageNumber - 1) * pageSize;

  const postsQuery = Thread.find({ parentId: { $in: [null, undefined] } })
    .sort({ createdAt: "desc" })
    .skip(skipAmount)
    .limit(pageSize)
    .populate({ path: "author", model: User })
    .populate({
      path: "children",
      populate: {
        path: "author",
        model: User,
        select: "_id name parentId image",
      },
    });

  const totalPostCount = await Thread.countDocuments({
    parentId: { $in: [null, undefined] },
  });

  const posts = await postsQuery.exec();

  const isNext = totalPostCount > skipAmount + posts.length;

  return { posts, isNext };
}

export async function fetchThreadById(id: string) {
  
  try {
    connectToDB();

    // TODO: Populate community
    const thread = await Thread.findById(id)
      .populate({
        path: 'author',
        model: User,
        select: "_id id name image"
      })
      .populate({
        path: 'children',
        populate: [
          {
            path: 'author',
            model: User,
            select: "_id id name parentId image"
         },
         {
          path: 'children',
          model: Thread,
          populate: {
            path: 'author',
            model: User,
            select: "_id id name parentId image"
          }
         }
        ]
      }).exec();

      return thread
  } catch (error: any) {
    throw new Error(`Error fetching thread ${error.message}`)
  }
}

export async function addCommentToThread(
  threadId: string,
  commentText: string,
  userId: string,
  path: string,
) {
  try {
    connectToDB()
    // find the original thread by its ID
    const originalThread = await Thread.findById(threadId);

    if(!originalThread) {
      throw new Error('Thread not found')
    }

    //create a new thread with the comment text

    const commentThread = new Thread({
      text: commentText,
      author: userId,
      parentId: threadId
    })

    //save the new thread

    const saveCommentThread = await commentThread.save()

    //Update the original thread to include the new comment
    originalThread.children.push(saveCommentThread._id)

    //Save the original thread
    await originalThread.save();

    revalidatePath(path)
  } catch (error: any) {
    throw new Error(`Error adding comment to thread: ${error.message}`)
  }
}

export async function fetchUserPost(userId: string) {
  
  try {
    connectToDB();
    // Find all threads authored by user with the given userId
    //TODO: Populate Community
    const threads = await User.findOne({
      path: 'threads',
      model: Thread,
      populate: {
        path: 'children',
        model: Thread,
        populate: {
          path: 'author',
          model: User,
          select: 'name image id username'
        }
      }
    })

    return threads
  } catch (error: any) {
    throw new Error(`Error fetching user post: ${error.message}`)
  }
}