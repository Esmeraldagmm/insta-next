"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { signIn, useSession, signOut } from "next-auth/react";
import Modal from "react-modal";
import { IoMdAddCircleOutline } from "react-icons/io";
import { HiCamera } from "react-icons/hi";
import { AiOutlineClose } from "react-icons/ai";
import { app } from "@/firebase";
import {
  getDownloadURL,
  getStorage,
  uploadBytesResumable,
  ref,
} from "firebase/storage";
import {
  addDoc,
  collection,
  getFirestore,
  serverTimestamp,
} from "firebase/firestore";

export default function Header() {
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false); // track the opening and closing of the modal
  const [selectedFile, setSelectedFile] = useState(null);
  const [imageFileURL, setImageFileURL] = useState(null);
  const filePickerRef = useRef(null);
  const [imageFileUploading, setImageFileUploading] = useState(false);
  const [postUploading, setPostUploading] = useState(false); // track the uploading of the post
  const [caption, setCaption] = useState(""); //post caption
  const db = getFirestore(app); //coming from firebase.js

  function addImageToPost(event) {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      setImageFileURL(URL.createObjectURL(file));
    }
  }

  useEffect(() => {
    if (selectedFile) {
      uploadImageToStorage();
    }
  }, [selectedFile]);

  async function uploadImageToStorage() {
    setImageFileUploading(true);
    const storage = getStorage(app);
    const fileName = new Date().getTime() + "-" + selectedFile.name;
    const storageRef = ref(storage, fileName);
    const uploadTask = uploadBytesResumable(storageRef, selectedFile);
    uploadTask.on(
      "state_changed",
      (snapshot) => {
        const progress =
          (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        console.log("Upload is " + progress + "% done");
      },
      (error) => {
        console.log(error);
        setImageFileUploading(false);
        setImageFileURL(null);
        setSelectedFile(null);
      },
      () => {
        getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
          setImageFileURL(downloadURL);
          setImageFileUploading(false);
        });
      }
    );
  }

  //it will be async because we need to wait for the image to upload
  async function handleSubmit() {
    setPostUploading(true);
    const docRef = await addDoc(collection(db, 'posts'), {
      username: session.user.username,
      caption,
      profileImg: session.user.image,
      image: imageFileURL,
      timestamp: serverTimestamp(),
    });
    setPostUploading(false);
    setIsOpen(false);
    location.reload();
  }

  return (
    <div className="shadow-sm border-b sticky top-0 bg-gray-100 z-30 p-3">
      <div className="flex justify-between items-center max-w-6xl mx-auto">
        {/* Logo */}
        <Link href="/" className="hidden lg:inline-flex">
          <Image
            src="/Instagram_logo_black.webp"
            width={96}
            height={96}
            alt="Instagram Logo"
          />
        </Link>

        <Link href="/" className="lg:hidden">
          <Image
            src="/800px-Instagram_logo_2016.webp"
            width={40}
            height={40}
            alt="Instagram Logo"
          />
        </Link>

        {/* Search Input */}
        <input
          type="text"
          placeholder="Search"
          className="bg-gray-50 border
         border-gray-200 rounded text-sm w-full py-2 px-4 max-w-[210px]"
        />

        {/* Menu Items */}
        {session ? (
          <div className="flex gap-2 items-center">
            <IoMdAddCircleOutline
              className="text-2xl cursor-pointer transform hover:scale-125 
            transition duration-300 hover:text-blue-500"
              onClick={() => setIsOpen(true)}
            />

            <img
              src={session.user.image}
              alt={session.user.name}
              className="h-10 w-10 rounded-full cursor-pointer"
              onClick={signOut}
            />
          </div>
        ) : (
          <button
            onClick={signIn}
            className=" text-sm font-semibold text-blue-500"
          >
            Log In
          </button>
        )}
      </div>
      {isOpen && (
        <Modal
          isOpen={isOpen}
          className="max-w-lg w-[90%] p-6 absolute 
          top-56 left-[50%] translate-x-[-50%] bg-white border-2 
          rounded-md shadow-md"
          onRequestClose={() => setIsOpen(false)}
          ariaHideApp={false}
        >
          <div className="flex flex-col justify-center items-center h-[100%]">
            {selectedFile ? (
              <img
                onClick={() => setSelectedFile(null)}
                src={imageFileURL}
                alt="Selected File"
                className={`w-full max-h-[250px] object-over cursor-pointer ${
                  imageFileUploading ? "animate-pulse" : " "
                }`}
              />
            ) : (
              <HiCamera
                onClick={() => filePickerRef.current.click()}
                className="text-45xl text-gray-400 cursor-pointer"
              />
            )}
            <input
              hidden
              ref={filePickerRef}
              type="file"
              accept="image/*"
              onChange={addImageToPost}
            />
          </div>
          <input //post caption
            type="text"
            maxLength="150"
            placeHolder="Please enter your caption..."
            className="m-4 border-none text-center w-full focus:ring-0 outline-none"
            onChange={(e) => setCaption(e.target.value)}
          />
          <button
            onClick={handleSubmit}
            disabled={
              !selectedFile ||
              caption.trim() == "" ||
              postUploading ||
              imageFileUploading
            }
            className="w-full bg-blue-500 text-white p-2 shadow-md rounded-lg hover:brightness-105 disabled:bg-gray-200 disabled:cursor-not-allowed disabled:hover:brightness-100"
          >
            Upload Post
          </button>
          <AiOutlineClose
            className="cursor-pointer absolute top-2 right-2 hover:text-blue-500 transition duration-300"
            onClick={() => setIsOpen(false)}
          />
        </Modal>
      )}
    </div>
  );
}
