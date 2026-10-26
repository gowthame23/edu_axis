const eventList = document.getElementById("eventList");

eventList.innerHTML = "";

async function getEvents() {
	try {
		const response = await fetch("/events", {
			method: "GET",
		});
		if (!response.ok) {
			throw new Error("Network response was not ok " + response.statusText);
		}
		const allEvents = await response.json();
		allEvents.forEach((element) => {
			let li = document.createElement("li");
			const formattedDate = formatDate(element.eventDate);

			li.innerHTML = `
            <div class="nature-card"><div class="uk-card uk-card-default uk-card-small" style="box-shadow: none" ><div class="uk-card-media-top">
												</div><div class="uk-card-header"><div class="uk-grid-small uk-flex-middle"
														data-uk-grid
													>
														<div class="uk-width-auto">
															<img
																class="uk-border-circle"
																alt=""
																width="40"
																height="40"
																src="img/avatar.svg"
															/>
														</div>
														<div class="uk-width-expand">
															<h6 class="uk-margin-remove-bottom uk-text-bold">
																${element.author}
															</h6>
															<p
																class="uk-text-meta uk-margin-remove-top uk-text-small"
															>
																<time 
																	>${element.published}</time
																>
															</p>
														</div>
														
													</div>
												</div>
												<div class="uk-card-body">
													<h4 class="uk-margin-small-bottom uk-text-bold">
														${element.title}
													</h4>
													<span class="uk-text-small"
														>${element.description}</span
													>
													<p class="fw-bold uk-text-warning">Event Date: ${formattedDate}</p>
												</div></div></div>`;
			eventList.appendChild(li);
		});

		// Process the events data as needed
	} catch (error) {
		console.error("There has been a problem with your fetch operation:", error);
	}
}

// Call the function to fetch events
getEvents();

function formatDate(dateString) {
	// Create a new Date object from the input date string
	const date = new Date(dateString);

	// Extract the day, month, and year from the Date object
	const day = date.getUTCDate();
	const month = date.toLocaleString("default", { month: "long" });
	const year = date.getUTCFullYear();

	// Return the formatted date string
	return `${day}, ${month}, ${year}`;
}

function confirmDelete() {
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
			document.getElementById("deleteForm").submit();
		}
	});
}

async function confirmDelete(id) {
	await Swal.fire({
		title: "Are you sure?",
		text: "You won't be able to revert this!",
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
