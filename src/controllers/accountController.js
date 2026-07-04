import User from "../models/User.js";

import bcrypt from "bcryptjs";
import { ObjectId } from 'mongodb';
import { OTP } from "../models/otp.js";
import { sendOTPEmail } from "../services/emailNotification.js";
import jwt from 'jsonwebtoken';





export const updatePassword = async (req, res, next) => {
    try {

        const { newPassword } = req.body;

        const userId = req.user.id


        if (!newPassword || newPassword.length < 6) {
            return res.status(400).json({
                statusCode: 400,
                data: null,
                message: "Password must be at least 6 characters long",
                error: null,
            })
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        const user = await User.findByIdAndUpdate(
            userId,
            { password: hashedPassword },
            { new: true }
        );

        if (!user) {
            return res.status(400).json({
                statusCode: 400,
                data: null,
                message: "User not found",
                error: null,
            })
        }

        return res.status(200).json({
            statusCode: 200,
            data: null,
            message: "Password updated successfully",
            error: null,
        })

    } catch (error) {
    const err = new Error(error);
    err.statusCode = 500;
    return next(err);
}
}



export const updateName = async (req, res, next) => {
    try {
        const { first_name, last_name } = req.body;
        const userId = req.user.id;

        // Check if first_name is missing
        if (!first_name) {
            return res.status(400).json({
                statusCode: 400,
                data: null,
                message: "First name is missing",
                error: null,
            });
        }

        // Find and update the user
        const user = await User.findByIdAndUpdate(
            userId,
            { first_name, last_name },
            { new: true }
        );

        // If user not found
        if (!user) {
            return res.status(400).json({
                statusCode: 400,
                data: null,
                message: "User not found",
                error: null,
            });
        }

        // Generate content with profile image URL
        const userCloudfrontUrl = user.profile_image
            ? user.profile_image
            : "https://randomuser.me/api/portraits/women/67.jpg";

        const contentWithUrl = {
            userId: user._id,
            firstName: user.first_name,
            lastName: user.last_name,
            email: user.email,
            profileImage: userCloudfrontUrl,
            createdAt: user.createdAt,
        };

        return res.status(200).json({
            statusCode: 200,
            data: contentWithUrl,
            message: "User updated successfully",
            error: null,
        });

    } catch (error) {
    const err = new Error(error);
    err.statusCode = 500;
    return next(err);
}
};




export const getDetails = async (req, res, next) => {
    try {


        const userId = req.user.id


        if (!userId) {
            return res.status(400).json({
                statusCode: 400,
                data: null,
                message: "User dont have access",
                error: null,
            })
        }

        const user = await User.aggregate(
            [
                {
                    $match:
                    /**
                     * query: The query in MQL.
                     */
                    {
                        _id: new ObjectId(userId)
                    }
                },
                {
                    $project:
                    /**
                     * specifications: The fields to
                     *   include or exclude.
                     */
                    {
                        _id: 1,
                        first_name: 1,
                        last_name: 1,
                        email: 1,
                        profile_image: 1,
                        createdAt: 1
                    }
                }
            ]
        )

        if (!user) {
            return res.status(400).json({
                statusCode: 400,
                data: null,
                message: "User not found",
                error: null,
            })
        }



        const contentWithUrl = user.map(user => {
            const userCloudfrontUrl = user.profile_image
                ? user.profile_image
                : "https://randomuser.me/api/portraits/women/67.jpg";
            // const userCloudfrontUrl = user.profile_image
            //     ? `${process.env.PUBLIC_CLOUDINARY_BASE_URL}/${user.profile_image}${process.env.PUBLIC_CLOUDINARY_IMAGE_EXTENSION}`
            //     : "https://randomuser.me/api/portraits/women/67.jpg";


            // Return full chat object with image URL
            return {
                userId: user._id,
                firstName: user.first_name,
                lastName: user.last_name,
                email: user.email,
                profileImage: userCloudfrontUrl,
                createdAt: user.createdAt

            };
        });

        return res.status(200).json({
            statusCode: 200,
            data: contentWithUrl[0],
            message: "User fetch successfully",
            error: null,
        })

    } catch (error) {
    const err = new Error(error);
    err.statusCode = 500;
    return next(err);
}
}


export const sendUserOtp = async (req, res, next) => {
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


        const findUser = await User.findOne({
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





        await sendOTPEmail(email)
        return res.status(200).json({
            statusCode: 200,
            data: null,
            message: "OTP send to Creator successfully",
            error: null,

        });



    } catch (error) {
    const err = new Error(error);
    err.statusCode = 500;
    return next(err);
}
}


export const sendForgotPasswordOtp = async (req, res, next) => {
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


        const findUser = await User.findOne({
            email: email
        })

        if (!findUser) {
            return res.status(400).json({
                statusCode: 400,
                message: "Email not found.",
                data: null,
                error: null
            })
        }





        await sendOTPEmail(email)
        return res.status(200).json({
            statusCode: 200,
            data: null,
            message: "OTP send to Creator successfully",
            error: null,

        });



    } catch (error) {
    const err = new Error(error);
    err.statusCode = 500;
    return next(err);
}
}



export const verifyUserOtp = async (req, res, next) => {
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

        findOtp.isValid = false;
        await findOtp.save()
        return res.status(200).json({
            statusCode: 200,
            message: "OTP verified successfully.",
            data: null,
            error: null
        })
    } catch (error) {
    const err = new Error(error);
    err.statusCode = 500;
    return next(err);
}
}


export const registerUserManually = async (req, res, next) => {
    try {
        const { firstName, lastName, password } = req.body;
        let { email } = req.body;



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


        const validateUser = await OTP.findOne({
            email: email,
            isValid: false
        })


        if (!validateUser) {
            return res.status(400).json({
                statusCode: 400,
                message: "User is not valid. Please resend the otp and try again to create account.",
                data: null,
                error: null
            })
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const saveUser = await User.create({
            email: email.toLowerCase(),
            first_name: firstName,
            last_name: lastName,
            password: hashedPassword
        })



        if (!saveUser) {
            return res.status(400).json({
                statusCode: 400,
                message: "failed to create user account.",
                data: null,
                error: null
            })
        }


        return res.status(200).json({
            statusCode: 200,
            message: "Your account created successfully.",
            data: null,
            error: null
        })

    } catch (error) {
    const err = new Error(error);
    err.statusCode = 500;
    return next(err);
}
}
export const resetPassword = async (req, res, next) => {
    try {
        const { otp, password } = req.body;
        let { email } = req.body;



        if (!email) {
            return res.status(400).json({
                statusCode: 400,
                message: "Email not provided.",
                data: null,
                error: null
            })
        }

        if (!otp) {
            return res.status(400).json({
                statusCode: 400,
                message: "OTO not provided.",
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


        const findOtp = await OTP.findOne({
            email: email,
            otp: otp,
            isValid: true
        })


        if (!findOtp) {
            return res.status(400).json({
                statusCode: 400,
                message: "OTP is not valid.",
                data: null,
                error: null
            })
        }

        findOtp.isValid = false;
        await findOtp.save()

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);


        const user = await User.findOne({
            email: email
        })

        if (!user) {
            return res.status(400).json({
                statusCode: 400,
                message: "User not found.",
                data: null,
                error: null
            })
        }

        user.password = hashedPassword;
        await user.save()

        return res.status(200).json({
            statusCode: 200,
            message: "Password updated successfully.",
            data: null,
            error: null
        })

    } catch (error) {
    const err = new Error(error);
    err.statusCode = 500;
    return next(err);
}
}


export const userLogin = async (req, res , next) => {
    try {
        const { password, fcm_token } = req.body;
        let { email } = req.body;

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


        const findAccount = await User.findOne({
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
            // const err = new Error("Invalid credentials");
            // err.statusCode = 400;
            // return next(err);
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
            { email: findAccount.email, role: "user", firstName: findAccount.first_name, profilePic: findAccount.profile_image },
            process.env.USER_SECRET_KEY,
        );


        if (token) {
            const creatorTokenUpdate = await User.updateOne(
                { email: email.toLowerCase() },
                { $set: { loginToken: token, isLogin: true, fcmToken: fcm_token ? fcm_token : "" } },
            );

        }




        return res.status(200).json({
            statusCode: 200,
            data: token,
            message: "User Logged In successfully",
            error: null,
        });


    } catch (error) {
    const err = new Error(error);
    err.statusCode = 500;
    return next(err);
}
}
