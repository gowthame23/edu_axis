const fs = require("fs");

const file = {
	deleteFile: async (filePath) => {
		return new Promise((resolve) => {
			fs.unlink(filePath, (err) => {
				if (err) {
					resolve(false);
				} else {
					resolve(true);
				}
			});
		});
	},
};
module.exports = file;
