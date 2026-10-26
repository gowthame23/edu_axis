const message = {
	save: async (User, theTitle, studentId) => {
		try {
			const updatedStudent = await User.findByIdAndUpdate(
				studentId,
				{
					$push: {
						messages: { title: theTitle, read: false },
					},
				},
				{ new: true } // This option returns the updated document
			);
			if (updatedStudent) {
				return true;
			} else {
				throw new Error("Message Not Saved!");
			}
		} catch (error) {
			return { error: error.message };
		}
	},
	markAsRead: async (User, studentId) => {
		try {
			const updatedStudent = await User.updateOne(
				{ _id: studentId },
				{ $set: { "messages.$[].read": true } } // $[] updates all elements in the array
			);
			return updatedStudent.modifiedCount > 0; // Return true if at least one document was modified
		} catch (error) {
			return { error: error.message };
		}
	},

	deleteAll: async (User, studentId) => {
		try {
			const result = await User.updateOne(
				{ _id: studentId },
				{ $set: { messages: [] } }
			);
			if (result && result.acknowledged) {
				return { success: true, modifiedCount: result.modifiedCount };
			}
			return { error: 'Delete operation not acknowledged' };
		} catch (error) {
			return { error: error.message };
		}
	},

	deleteOne: async (User, studentId, messageId) => {
		try {
			if (!messageId) return { error: 'messageId is required' };
			const result = await User.updateOne(
				{ _id: studentId },
				{ $pull: { messages: { _id: messageId } } }
			);
			if (result && result.acknowledged) {
				return { success: true, modifiedCount: result.modifiedCount };
			}
			return { error: 'Delete operation not acknowledged' };
		} catch (error) {
			return { error: error.message };
		}
	},
};
module.exports = message;
