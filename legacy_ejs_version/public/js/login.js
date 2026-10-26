const usernameInput = document.getElementById("usernameInput");

const changeLabel = async (userType) => {
	usernameInput.placeholder = `${userType} Username`;
};
