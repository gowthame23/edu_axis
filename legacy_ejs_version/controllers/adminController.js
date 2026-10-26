const Admin = require("../models/adminModel");

const admin = {
	createFirst: async (username, password) => {
		try {
			const adminFound = await Admin.find({ username: username });

			if (!(adminFound.length > 0)) {
				Admin.register({ username: username }, password, (err, user) => {
					if (err) {
						throw new Error(err.message);
					} else {
						return true;
					}
				});
			} else {
				return true;
			}
		} catch (error) {
			return { error: error.message };
		}
	},
};
module.exports = admin;
