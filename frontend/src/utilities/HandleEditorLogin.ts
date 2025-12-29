import {firebaseAuth} from "./firebaseconf.ts";
import {GoogleAuthProvider,signInWithPopup} from "firebase/auth"
import { apiCall } from "@/utilities/api.ts";

export const HandleEditorLogin=async () =>{
	try {
		const provider = new GoogleAuthProvider();
		provider.setCustomParameters({
			prompt: 'select_account'
		});
		
		const {user}= await signInWithPopup(firebaseAuth, provider);
		if(user.email && user.emailVerified){
			return new Promise(async (resolve, reject)=>{
				try {
					// Call backend to create/check editor in PostgreSQL
					const response = await apiCall(`/api/editor/register`, 'POST', {
						email: user.email,
						creators: [],
						rating: 0,
						people: 0
					});

					resolve(response.email || user.email);
				} catch (error) {
					reject(new Error("Error occurred while registering editor"));
				}
			})
		}
		else{
			return new Promise((_res, reject)=>{
				reject(new Error("Error occurred at Email Verification"));
			})
		}

	}
	catch(err){
		return new Promise((_res, reject)=>{
			reject(new Error("Login Window Discarded"));
		})
	}
}
