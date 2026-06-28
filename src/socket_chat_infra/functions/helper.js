import Host from "../../models/Host.js";
import User from "../../models/User.js";

export const findCreatorDetails = async (from, socket, data) => {
	return await Host.findById(
		from === "flutter" ? socket.creator.id : data.creator_id,
	);
};

export const findUserDetails = async (from, socket, data) => {
	return await User.findById(from === "web" ? socket.user.id : data.user_id);
};