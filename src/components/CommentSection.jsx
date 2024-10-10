"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { app } from "../firebase";
import { addDoc, collection, getFirestore, onSnapshot, orderBy, serverTimestamp, query } from "@firebase/firestore";
import Moment from "react-moment";

export default function CommentSection({ id }) {
    const { data: session } = useSession();
    const [comment, setComment] = useState("");
    const [comments, setComments] = useState([]);
    const db = getFirestore(app);

    async function handleSubmit(e) {
        e.preventDefault();
        const commentToPost = comment;  
        setComment(""); //after comment is posted, clear the input field
        await addDoc(collection(db, "posts", id, "comments"), 
        {
            comment: commentToPost,
            username: session?.user?.username,
            userImage: session?.user?.image,
            timestamp: serverTimestamp(),
        });
    }

    useEffect(() => {
        onSnapshot(query(collection(db, "posts", id, "comments"), orderBy("timestamp", "desc")),
        (snapshot) => {
            setComments(snapshot.docs);
        }
        ); 
    }, [db]);

    return(
        <div>
            {comments.length > 0 && (
                 <div className="mx-10 max-h-24 overflow-y-scroll">
                    {comments.map((comment, id) => (
                        <div key={id} className="flex items-center space-x-2 mb-2 justify-between">
                            <img 
                            src={comment.data().userImage} 
                            alt="user image" 
                            className="h-7 w-7 rounded-full object-cover border p-[2px]"
                            />
                            <p className="text-sm flex-1 truncate pl-1">
                                <span className="font-semibold">{comment.data().username}</span>{""}
                                {comment.data().comment}
                            </p>
                            <Moment fromNow className="text-xs text-gray-400 pr-2">
                                {comment.data().timestamp?.toDate()}
                            </Moment>
                        </div>
                    ))}
                </div>
            )}
            {session && (
                <form  onSubmit={handleSubmit} className="flex items-center p-4 gap-2">
                    <img 
                    src={session.user.image} 
                    alt="user image" 
                    className="h-10 w-10 rounded-full border p-[4px] object-cover"
                    />
                    <input 
                    type="text"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Add a comment..."
                    className="border-none flex-1 focus:ring-0 outline-none"
                    />
                    <button
                    disabled={!comment.trim()}
                    type="submit"
                    className="font-semibold text-blue-400 disabled:cursor-not-allowed disabled:text-blue-400"
                    >
                        Post
                    </button>
                </form>
            )}
        </div>
    );
}