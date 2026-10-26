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
            <div class="nature-card"><div class="uk-card uk-card-default uk-card-small uk-background-dark" style="box-shadow: none" ><div class="uk-card-media-top">
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
	} catch (error) {
		console.error("There has been a problem with your fetch operation:", error);
	}
}
getEvents();

function formatDate(dateString) {
	const date = new Date(dateString);

	const day = date.getUTCDate();
	const month = date.toLocaleString("default", { month: "long" });
	const year = date.getUTCFullYear();

	return `${day}, ${month}, ${year}`;
}
