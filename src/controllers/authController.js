import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { OTP } from '../models/otp.js';
// import { sendOTPEmail } from '../services/emailNotification.js';
import { sendOTPEmail } from '../services/emailNotification.js';
import Host from '../models/Host.js';
import HostEarning from '../models/HostEarning.js';
import passport from "passport";

// export const register = async (req, res) => {
//   try {
//     const { name, email, password } = req.body;

//     const existingUser = await User.findOne({ email });
//     if (existingUser) return res.status(400).json({ message: 'User already exists' });

//     const salt = await bcrypt.genSalt(10);
//     const hashedPassword = await bcrypt.hash(password, salt);

//     const user = new User({ name, email, password: hashedPassword });
//     await user.save();

//     res.status(201).json({ message: 'User registered successfully' });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: 'Server error' });
//   }
// };

// export const login = async (req, res) => {
//   try {
//     const { email, password } = req.body;

//     const user = await User.findOne({ email });
//     if (!user) return res.status(400).json({ message: 'Invalid credentials' });

//     const isMatch = await bcrypt.compare(password, user.password);
//     if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

//     const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

//     res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: 'Server error' });
//   }
// };



export const GoogleUser = async (req, res, next) => {
	// console.log("Data",req.body);
	const reqBody = {};
	const data = req.body.providerData;
	const fullname = data.displayName.split(" ");
	reqBody.first_name = fullname[0];
	reqBody.last_name = fullname.slice(1).join(" ");
	reqBody.sign_up_method = "Google";
	reqBody.email = data.email.toLowerCase();
	reqBody.fcm_token = data.fcm_token;
	reqBody.profile_image = data.profile_image;
	// reqBody.profile_image = data.photoURL;

	try {
		// const {first_name,last_name,email,phone_number,gender} = req.body
		if (reqBody.email === undefined) {
			return res.status(500).json({
				statusCode: 500,
				data: null,
				message: null,
				error: "Email is required.",
				requestId: req.locals.id,
			});
		}

		const checkIfUserExist = await User.findOne({
			email: reqBody.email,
		});

		let user;

		// console.log("called........", checkIfUserExist);

		if (checkIfUserExist) {
			// console.log("User Exist")

			if (checkIfUserExist?.isDeleted) {
				return res.status(400).json({
					statusCode: 400,
					message: "We couldn't find the account you're looking for. It may have been deleted. If you have any questions, please contact our support team.",
					data: null,
					error: null,
					requestId: req.locals.id
				})
			}


			if (checkIfUserExist?.isDisabled) {
				return res.status(400).json({
					statusCode: 400,
					message: "Your account is currently disabled. Please contact our support team to reactivate it.",
					data: null,
					error: null,
					requestId: req.locals.id
				})
			}

			user = checkIfUserExist;
			user.has_logged_in_for_first_time = false;
			user.fcm_token = reqBody.fcm_token
		} else {
			// console.log("User Doesn't exist")

			if (req.body.email) {
				req.body.email = req.body.email.toLowerCase();
			}

			user = await User.create(reqBody);

			user.has_logged_in_for_first_time = true;
		}



		user.is_logged_in = true;
		await user.save();

		const token = jwt.sign(
			{ email: user.email, role: "user", firstName: user.first_name },
			process.env.USER_SECRET_KEY,
		);

		const userObj = user.toObject();
		userObj.token = token;


		return res.status(200).json({
			statusCode: 200,
			data: userObj,
			message: "Users logged In successfully",
			error: null,
		});

	} catch (error) {


		res.status(500).json({
			statusCode: 500,
			data: null,
			message: null,
			error: error.message,
		});
	}
};


export const initiateGoogleLogin = (req, res, next) => {
  const redirectTo = req.query.redirectTo || "";

  const state = JSON.stringify({ redirectTo });

  passport.authenticate("google", {
    scope: ["profile", "email"],
    state, // ✅ pass redirect info
  })(req, res, next);
};


export const googleCallback = (req, res, next) => {
  passport.authenticate(
    "google",
    { failureRedirect: "/signin" },
    async (err, profile) => {
      try {
        if (err || !profile) {
          return res.redirect(`${process.env.FRONTEND_BASE_URL}/signin`);
        }

        // Parse state
        // const { redirectTo, creatorName } = req.query.state
        //   ? JSON.parse(req.query.state as string)
        //   : { redirectTo: "", creatorName: "" };

        //  const redirectTo = req.session.redirectTo || '/';

 const { redirectTo } = req.query.state
          ? JSON.parse(req.query.state)
          : { redirectTo: ""};


        // try {
        //   if (req.query.state) {
        //     const parsed = JSON.parse(req.query.state);
        //     redirectTo = parsed.redirectTo || "";
        //   }
        // } catch (e) {
        //   console.error("Invalid state", e);
        // }

        const email = profile.emails[0].value.toLowerCase().trim();
        const firstName = profile.name.givenName;
        const lastName = profile.name.familyName;
        const profileImage =
					profile.photos && profile.photos.length > 0
						? profile.photos[0].value
						: null;

        let user = await User.findOne({ email });
        if (!user) {
          user = await User.create({
            first_name: firstName,
            last_name: lastName,
            email,
            sign_up_method: "Google",
            profile_image: profileImage, 
          });

        }

      	const token = jwt.sign(
			{ email: user.email, role: "user", firstName: user.first_name },
			process.env.USER_SECRET_KEY,
		);

        const safeRedirect = redirectTo ? `/${redirectTo}` : "";
		console.log("link" , `${redirectTo}/?token=${token}&email=${user.email}`)
      res.redirect(
		`${process.env.FRONTEND_BASE_URL}/?redirectTo=${redirectTo}&token=${token}&email=${user.email}`
    //   res.redirect(
	// 	`${process.env.FRONTEND_BASE_URL}/${redirectTo}?token=${token}&email=${user.email}`
		
//   `${process.env.FRONTEND_BASE_URL}/${redirectTo}/chatsection?	=${token}&email=${user.email}`
//   `${process.env.FRONTEND_BASE_URL}`
);

        // res.redirect(
        //   `${process.env.FRONTEND_BASE_URL}/${redirectTo}/signin?token=${token}&email=${user.email}`
        // );
      } catch (error) {
        console.error(error);
        res.redirect(`${process.env.FRONTEND_BASE_URL}/signin`);
      }
    }
  )(req, res, next);
};


export const registerHost = async (req, res) => {
	try {
//esme ek otp false vaala bhi chekc lga do 
		const { firstName, lastName,  mobile, password } = req.body;
		let {email} = req.body;

		if (!mobile) {
			return res.status(400).json({
				statusCode: 400,
				message: "Mobile not provided.",
				data: null,
				error: null
			})
		}

		if (!email) {
			return res.status(400).json({
				statusCode: 400,
				message: "Email not provided.",
				data: null,
				error: null
			})
		}
		if (!lastName) {
			return res.status(400).json({
				statusCode: 400,
				message: "Last Name not provided.",
				data: null,
				error: null
			})
		}
		if (!firstName) {
			return res.status(400).json({
				statusCode: 400,
				message: "First Name not provided.",
				data: null,
				error: null
			})
		}
		if (!password) {
			return res.status(400).json({
				statusCode: 400,
				message: "Password not provided.",
				data: null,
				error: null
			})
		}

        email = email.toLowerCase();

		// Enforce OTP verification check
		const verifiedOtp = await OTP.findOne({
			email: email,
			isVerified: true
		});

		if (!verifiedOtp) {
			return res.status(400).json({
				statusCode: 400,
				message: "Email verification required. Please verify OTP first.",
				data: null,
				error: null
			});
		}

		const salt = await bcrypt.genSalt(10);
		const hashedPassword = await bcrypt.hash(password, salt);


		const saveHost = await Host.create({
			email: email,
			firstName: firstName,
			lastName: lastName,
			profilePic: "",
			mobileNumber: mobile,
			password: hashedPassword
		})



		if (!saveHost) {
			return res.status(400).json({
				statusCode: 400,
				message: "failed to create host account.",
				data: null,
				error: null
			})
		}

		// Delete OTP record after successful registration
		await OTP.deleteOne({ _id: verifiedOtp._id });


		await HostEarning.create({
			hostId: saveHost.id
		})

		// const token = jwt.sign(
		// 	{ email: saveHost.email, role: "host", firstName: saveHost.firstName  , profilePic:saveHost.profilePic},
		// 	process.env.USER_SECRET_KEY,
		// );

		return res.status(200).json({
			statusCode: 200,
			message: "Your account created successfully.",
			data: null,
			error: null
		})

	} catch (error) {
		res.status(500).json({
			statusCode: 500,
			data: null,
			message: error.message,
			error: error,
		});
	}
}


export const verifyOtp = async (req, res) => {
	try {
		let { otp, email } = req.body;
		if (!otp) {
			return res.status(400).json({
				statusCode: 400,
				message: "OTP not provided.",
				data: null,
				error: null
			})
		}

		if (!email) {
			return res.status(400).json({
				statusCode: 400,
				message: "Email not provided.",
				data: null,
				error: null
			})
		}

		        email = email.toLowerCase();

		const findOtp = await OTP.findOne({
			email: email,
			otp: otp,
			isValid: true
		})


		if (!findOtp) {
			return res.status(400).json({
				statusCode: 400,
				message: "Invalid OTP.",
				data: null,
				error: null
			})
		}

		findOtp.isVerified = true;
		findOtp.isValid = false;
		await findOtp.save()
		return res.status(200).json({
			statusCode: 200,
			message: "OTP verified successfully.",
			data: null,
			error: null
		})
	} catch (error) {
		res.status(500).json({
			statusCode: 500,
			data: null,
			message: error.message,
			error: error,
		});
	}
}


export const sendOtp = async (req, res) => {
	try {

		let { email } = req.body;

		if (!email) {
			return res.status(400).json({
				statusCode: 400,
				message: "Email not provided.",
				data: null,
				error: null
			})
		}
        email = email.toLowerCase();

		const findUser = await Host.findOne({
			email: email
		})

		if (findUser) {
			return res.status(400).json({
				statusCode: 400,
				message: "Email already registered.",
				data: null,
				error: null
			})
		}




		// const generateOTP = Math.floor(100000 + Math.random() * 900000);

		// const saveOTP = await OTP.create({
		// 	email: email,
		// 	otp: generateOTP
		// })


		// if (!saveOTP) {
		// 	return res.status(400).json({
		// 		statusCode: 400,
		// 		message: "Failed to create OTP.",
		// 		data: null,
		// 		error: null
		// 	})
		// }

		await sendOTPEmail(email);

		return res.status(200).json({
			statusCode: 200,
			data: null,
			message: "OTP send to Creator successfully",
			error: null,

		});



	} catch (error) {

		return res.status(500).json({
			statusCode: 500,
			data: null,
			message: error.message,
			error: error,
		});
	}
}


export const hostLogin = async (req, res) => {
	try {
		let { email, password , fcmToken} = req.body;

		if (!email) {
			return res.status(400).json({
				statusCode: 400,
				message: "Email not provided.",
				data: null,
				error: null
			})
		}


		if (!password) {
			return res.status(400).json({
				statusCode: 400,
				message: "Password not provided.",
				data: null,
				error: null
			})
		}

		        email = email.toLowerCase();


		const findAccount = await Host.findOne({
			email: email
		})

		if (!findAccount) {
			return res.status(400).json({
				statusCode: 400,
				message: "Account not found.",
				data: null,
				error: null
			})
		}

		const isMatch = await bcrypt.compare(password, findAccount.password);


		if (!isMatch) {
			return res.status(400).json({
				statusCode: 400,
				message: "Invalid credentials.",
				data: null,
				error: null
			})
		}

		if (!findAccount.isKycVerified) {
			return res.status(401).json({
				statusCode: 401,
				data: null,
				message: "User KYC is not verified",
				error: "KYC verification required",
			});
		}


		if (findAccount.isDeleted) {
			return res.status(400).json({
				statusCode: 400,
				data: null,
				message: "Your account has been successfully deleted. If you wish to reactivate it, please contact us.",
				error: null,
			});
		}



		if (findAccount.isDisabled) {
			return res.status(400).json({
				statusCode: 400,
				data: null,
				message: "We are processing your account deletion request and will be deleting your account in the next 48 hours.",
				error: null,
			});
		}


		const token = jwt.sign(
			{ email: findAccount.email, role: "host", firstName: findAccount.firstName, profilePic: findAccount.profilePic },
			process.env.USER_SECRET_KEY,
		);


		if (token) {
			const creatorTokenUpdate = await Host.updateOne(
				{ email: email.toLowerCase() },
				{ $set: { loginToken: token, isLogin: true , fcmToken:fcmToken } },
			);

		}




		return res.status(200).json({
			statusCode: 200,
			data: token,
			message: "Host Logged In successfully",
			error: null,
		});


	} catch (error) {
		return res.status(500).json({
			statusCode: 500,
			data: null,
			message: error.message,
			error: error,
		});
	}
}



export const hostLogout = async (req, res) => {
	try {
		const hostId = req.hostInfo?.id;

		if (!hostId) {
			return res.status(401).json({
				statusCode: 401,
				message: "Access denied. Not authorized.",
				data: null,
				error: null
			});
		}

		const host = await Host.findOne({
			_id: hostId
		})

		if (!host) {
			return res.status(400).json({
				statusCode: 400,
				message: "Account not found.",
				data: null,
				error: null
			})
		}


		host.loginToken = "";
		host.fcmToken = null;
		host.isLogin = false;
		await host.save();



		return res.status(200).json({
			statusCode: 200,
			data: host,
			message: "Host Logged out successfully",
			error: null,
			requestId: req.locals?.id
		});


	} catch (error) {
		res.status(500).json({
			statusCode: 500,
			data: null,
			message: error.message,
			error: error,
		});
	}
}


export const forgotPassword = async (req, res) => {
	try {
		let { email } = req.body;
		if (!email) {
			return res.status(400).json({
				statusCode: 400,
				data: null,
				message: "Email not provided.",
				error: null,
			});
		}

		        email = email.toLowerCase();


		const findEmail = await Host.findOne({
			email: email
		})

		if (!findEmail) {
			return res.status(400).json({
				statusCode: 400,
				data: null,
				message: "Email not found. Please create an account.",
				error: null,
			});
		}

		await sendOTPEmail(email);

		return res.status(200).json({
			statusCode: 200,
			data: null,
			message: "Email found",
			error: null,
		});



	} catch (error) {
		return res.status(500).json({
			statusCode: 500,
			data: null,
			message: error.message,
			error: error,
		});
	}
}



export const verifyOtpForgotPassword = async (req, res) => {
	try {
		let { email, otp } = req.body;
		if (!email) {
			return res.status(400).json({
				statusCode: 400,
				data: null,
				message: "Email not provided.",
				error: null,
			});
		}

		        email = email.toLowerCase();


		const findEmail = await Host.findOne({
			email: email
		})

		if (!findEmail) {
			return res.status(400).json({
				statusCode: 400,
				data: null,
				message: "Email not found. Please create an account.",
				error: null,
			});
		}

		const findOtp = await OTP.findOne({
			email: email,
			otp: otp,
			isValid: true
		})


		if (!findOtp) {
			return res.status(400).json({
				statusCode: 400,
				message: "Invalid OTP.",
				data: null,
				error: null
			})
		}

		findOtp.isVerified = true;
		findOtp.isValid = false;
		await findOtp.save()
		return res.status(200).json({
			statusCode: 200,
			message: "OTP verified successfully.",
			data: null,
			error: null
		})



	} catch (error) {
		return res.status(500).json({
			statusCode: 500,
			data: null,
			message: error.message,
			error: error,
		});
	}
}


export const resetForgotPassword = async (req, res) => {
	try {
		let { email, password } = req.body;
		if (!email) {
			return res.status(400).json({
				statusCode: 400,
				data: null,
				message: "Email not provided.",
				error: null,
			});
		}

		if (!password) {
			return res.status(400).json({
				statusCode: 400,
				data: null,
				message: "Password not provided.",
				error: null,
			});
		}


		        email = email.toLowerCase();

		const findEmail = await Host.findOne({
			email: email
		})

		if (!findEmail) {
			return res.status(400).json({
				statusCode: 400,
				data: null,
				message: "Email not found. Please create an account.",
				error: null,
			});
		}


		// Enforce OTP verification check before resetting password
		const verifiedOtp = await OTP.findOne({
			email: email,
			isVerified: true
		});

		if (!verifiedOtp) {
			return res.status(400).json({
				statusCode: 400,
				message: "Email verification required. Please verify OTP first.",
				data: null,
				error: null
			});
		}

		const salt = await bcrypt.genSalt(10);
		const hashedPassword = await bcrypt.hash(password, salt);

		findEmail.password = hashedPassword;
		await findEmail.save();

		// Delete the OTP document after successful password reset
		await OTP.deleteOne({ _id: verifiedOtp._id });

		return res.status(200).json({
			statusCode: 200,
			message: "Password reset successfully.",
			data: null,
			error: null
		})



	} catch (error) {
		return res.status(500).json({
			statusCode: 500,
			data: null,
			message: error.message,
			error: error,
		});
	}
}

