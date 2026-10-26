const teachersList = document.getElementById("teachersList");
teachersList.innerHTML = "";
async function getTeachers() {
	try {
		const response = await fetch("/teachers", {
			method: "GET",
		});

		if (!response.ok) {
			throw new Error("Network response was not ok " + response.statusText);
		}

		const allEvents = await response.json();
		teachersList.innerHTML = "";

		// Assuming allEvents is an array containing event objects with 'username' property
		allEvents.forEach((element, index) => {
			let item = document.createElement("div");
			let joined = formatDate(element.createdAt);

			item.innerHTML = `
            <div class="uk-card uk-card-default uk-card-small">
						
							<div class="uk-card-header">
								<div class="uk-grid-small uk-flex uk-flex-middle" data-uk-grid>
									<div class="uk-width-expand">
                                        <!-- card -->
									<div>
										<div class="uk-card uk-card-default uk-card-small" style="box-shadow: none;">
											
											<div class="uk-card-header">
												<div class="uk-grid-small uk-flex-middle" data-uk-grid>
													<div class="uk-width-auto">
														<img class="uk-border-circle" alt="" width="40" height="40" src="https://unsplash.it/60/60/?random">
													</div>
													<div class="uk-width-expand">
														<h6 class="uk-margin-remove-bottom uk-text-bold">${element.username}</h6>
														<p class="uk-text-meta uk-margin-remove-top uk-text-small"><span class="text-warning">Joined: </span> ${joined}</p>
													</div>
												</div>
											</div>
										
										</div>
									</div>
									<!-- /card -->
                                </div><div class="uk-width-auto">
                                            <div class="uk-inline">
                                                <a data-uk-icon="icon:more-vertical"></a>
                                                <div data-uk-dropdown="mode: click; pos:top-right">
                                                    <ul class="uk-nav uk-dropdown-nav">
                                                        <li class="uk-nav-header">Actions</li>
                                                        <li><a href="#"><span data-uk-icon="icon: lifesaver; ratio: 0.9"></span> More Info</a></li>
                                                        <li><a href="#"><span data-uk-icon="icon: comments; ratio: 0.9"></span>Send Message</a></li>
                                                        <li><a href="#"><span data-uk-icon="icon: lifesaver; ratio: 0.9"></span> Change Password</a></li>
                                                        <li><div
                                                        class="uk-width-expand uk-text-right panel-icons"
                                                    >
                                                    <form id="${element._id}" action="/teachers/delete/${element._id}" method="post">
                                                    <button
                                                        type="button"
                                                        class="uk-icon-link"
                                                        title="Delete Teacher"
                                                        data-uk-tooltip
                                                        data-uk-icon="icon: trash"
                                                        onclick="confirmDelete('${element._id}')"
                                                    ></button>
                                                </form>
                                                    </div></li>
                                                    </ul>
                                                </div>
                                            </div>
                                            
									</div>
								</div>
							</div>
						</div>
            `;
			teachersList.appendChild(item);
		});
	} catch (error) {
		console.error("There has been a problem with your fetch operation:", error);
	}
}
getTeachers();

function confirmDelete(id) {
	Swal.fire({
		title: "Are you sure?",
		text: "You won't be able to revert this!",
		html: "All data related to this account will be deleted including the assignments.",
		icon: "warning",
		confirmButtonText: "Yes, delete it!",
		showCancelButton: true,
		confirmButtonColor: "#3085d6",
		cancelButtonColor: "#d33",
	}).then((result) => {
		if (result.isConfirmed) {
			document.getElementById(id).submit();
		}
	});
}

function formatDate(dateString) {
	// Create a new Date object from the input date string
	const date = new Date(dateString);

	// Extract day, month, and year from the date object
	const day = date.getUTCDate();
	const month = date.getUTCMonth() + 1; // Months are zero-based, so add 1
	const year = date.getUTCFullYear();

	// Format day and month to be two digits
	const formattedDay = day < 10 ? "0" + day : day;
	const formattedMonth = month < 10 ? "0" + month : month;

	// Format year to be in yy format
	const formattedYear = year.toString().slice(-2);

	// Return the formatted date string in dd/mm/yy format
	return `${formattedDay}/${formattedMonth}/${formattedYear}`;
}
