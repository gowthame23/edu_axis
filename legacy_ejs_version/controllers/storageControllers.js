const fs = require("fs");

const storage = {
	createAssignments: async () => {
		try {
			const assignmentDir = "./Assignments";
			const assignmentsGivenDir = `${assignmentDir}/Given`;

			if (!fs.existsSync(assignmentDir)) {
				fs.mkdirSync(assignmentDir).then(() => {
					if (!fs.existsSync(assignmentsGivenDir)) {
						fs.mkdirSync(assignmentsGivenDir);
					}
				});
				return true;
			} else {
				return true;
			}
		} catch (error) {
			return { error: error.message };
		}
	},
};
module.exports = storage;
