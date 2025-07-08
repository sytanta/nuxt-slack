import { ConvexError } from "convex/values";

async function handleServerAction<T extends () => Promise<any>>(
  convexAction: T
): Promise<ReturnType<T>> {
  try {
    return await convexAction();
  } catch (e) {
    let statusCode = 500;
    let message = (e as unknown as Error).message;

    // Handle Convex error
    if (e instanceof ConvexError) {
      statusCode = e.data.code;
      message = e.data.message;
    }

    throw createError({
      statusCode,
      message,
    });
  }
}

// const handleServerAction = async (
//   convexAction: () => Promise<unknown> | unknown
// ) => {
//   try {
//     return await convexAction();
//   } catch (e) {
//     let statusCode = 500;
//     let message = (e as unknown as Error).message;

//     // Handle Convex error
//     if (e instanceof ConvexError) {
//       statusCode = e.data.code;
//       message = e.data.message;
//     }

//     throw createError({
//       statusCode,
//       message,
//     });
//   }
// };

export default handleServerAction;
