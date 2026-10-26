const eventsList = document.getElementById("eventList") || document.getElementById("List");

if (eventsList) {
	eventsList.innerHTML = "";
}

async function getEvents() {
	try {
		const response = await fetch("/events", {
			method: "GET",
		});

		if (!response.ok) {
			throw new Error("Network response was not ok " + response.statusText);
		}


		const allEvents = await response.json();
		if (eventsList) eventsList.innerHTML = ""; // clear before repopulating to avoid duplicates
		allEvents.forEach((element) => {
			let li = document.createElement("li");
			const formattedDate = formatDate(element.eventDate);

			li.innerHTML = `
            <div><div class="uk-card uk-card-default uk-card-small" style="box-shadow: none" ><div class="uk-card-media-top">
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
														<div
															class="uk-width-expand uk-text-right panel-icons"
														>
														<form id="deleteForm" data-id="${element._id}">
														<button
															type="button"
															class="uk-icon-link"
															title="Delete Event"
															data-uk-tooltip
															data-uk-icon="icon: trash"
															onclick="confirmDelete(this)"
														></button>
														</form>
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
			eventsList.appendChild(li);
		});

	} catch (error) {
		console.error("There has been a problem with your fetch operation:", error);
	}
}
if (eventsList) getEvents();

async function confirmDelete(button) {
	const result = await Swal.fire({
		title: "Delete this event?",
		text: "This action cannot be undone.",
		icon: "warning",
		showCancelButton: true,
		confirmButtonText: "Yes, delete",
		cancelButtonText: "Cancel",
		confirmButtonColor: "#d33",
	});
	if (!result.isConfirmed) return;

	const form = button.closest("form");
	const eventId = form.getAttribute("data-id");

	try {
		const response = await fetch(`/events/delete/${eventId}`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
		});
		const data = await response.json().catch(() => ({}));
		if (!response.ok) {
			throw new Error(data && data.message ? data.message : "Failed to delete event");
		}
		// Remove the card from DOM
		const card = form.closest(".uk-card");
		if (card && card.parentElement) {
			card.parentElement.remove(); // remove the wrapping container
		}
		Swal.fire({ title: "Deleted", icon: "success", timer: 1200, showConfirmButton: false });
	} catch (error) {
		console.error("Error deleting event:", error);
		Swal.fire({ title: "Error", text: String(error.message || error), icon: "error" });
	}
}
function formatDate(dateString) {
	const date = new Date(dateString);

	const day = date.getUTCDate();
	const month = date.toLocaleString("default", { month: "long" });
	const year = date.getUTCFullYear();

	return `${day}, ${month}, ${year}`;
}

function confirmClassDelete(id) {
	Swal.fire({
		title: "Are you sure?",
		text: "You won't be able to revert this!",
		icon: "warning",
		confirmButtonText: "Yes, delete it!",
		showCancelButton: true,
		confirmButtonColor: "#3085d6",
		cancelButtonColor: "#d33",
	}).then(async (result) => {
		if (!result.isConfirmed) return;

		const form = document.getElementById(id);
		if (!form) return;

		const action = form.getAttribute("action") || "";
		// Use fetch for deletion to avoid page reload for classes, teachers, and students
		if (action.includes("/classes/delete/") || action.includes("/teachers/delete/") || action.includes("/students/delete/")) {
			try {
				const response = await fetch(action, { method: "POST", headers: { "Content-Type": "application/json" } });
				const data = await response.json().catch(() => ({}));
				if (!response.ok) {
					throw new Error((data && (data.message || data.error)) || "Failed to delete");
				}
				// Remove the card from the DOM
				const card = form.closest(".uk-card");
				const wrapper = card ? card.closest(".nature-card") : null;
				if (wrapper) wrapper.remove();
				Swal.fire({ title: "Deleted", icon: "success", timer: 1200, showConfirmButton: false });
			} catch (err) {
				console.error("Delete failed:", err);
				Swal.fire({ title: "Error", text: String(err.message || err), icon: "error" });
			}
		} else {
			form.submit();
		}
	});
}

// ---- Events: Create via Fetch (no reload) ----
(function setupEventCreateAjax(){
	const form = document.querySelector('#modal-center form[action="/events"]');
	if (!form) return;

	// set min date to today for event date input
	const dateInput = form.querySelector('#eventDate');
	if (dateInput) {
		const today = new Date();
		const yyyy = today.getFullYear();
		const mm = String(today.getMonth() + 1).padStart(2, '0');
		const dd = String(today.getDate()).padStart(2, '0');
		dateInput.min = `${yyyy}-${mm}-${dd}`;
	}

	form.addEventListener('submit', async function(e){
		e.preventDefault();
	const title = (form.querySelector('#title')?.value || '').trim();
		const description = (form.querySelector('#eventDescription')?.value || '').trim();
		const eventDate = (form.querySelector('#eventDate')?.value || '').trim();
		const author = form.querySelector('input[name="author"]')?.value || 'Admin';
		const published = form.querySelector('input[name="published"]')?.value || 'Today';

		const isNumbersOnly = title.replace(/\s+/g, '').match(/^\d+$/);
		if (!title || !description || !eventDate) {
			return Swal.fire({ title: 'All fields are required', icon: 'warning' });
		}
		if (isNumbersOnly) {
			return Swal.fire({ title: 'Title cannot be only numbers', icon: 'warning' });
		}

		try {
			const res = await fetch('/events', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ title, description, eventDate, author, published })
			});
			// Try JSON; if redirect/HTML returned, still treat as success
			let data = null;
			try { data = await res.json(); } catch { /* ignore */ }
			if (!res.ok) {
				throw new Error((data && data.message) || 'Failed to publish event');
			}

			// Best effort refresh of events list so new event shows up
			if (typeof getEvents === 'function') {
				await getEvents();
			}

			// reset form and close modal
			form.reset();
			if (window.UIkit && UIkit.modal) {
				try { UIkit.modal('#modal-center').hide(); } catch(_) {}
			}

			Swal.fire({ title: 'Published', icon: 'success', timer: 1200, showConfirmButton: false });
		} catch (err) {
			console.error('Publish event failed:', err);
			Swal.fire({ title: 'Error', text: String(err.message || err), icon: 'error' });
		}
	});
})();

// ---- Deferments: Reject via Fetch (no reload) ----
(function setupDefermentRejectAjax(){
	document.addEventListener('click', async function(e){
		const link = e.target.closest('[data-deferment-reject]');
		if (!link) return;
		e.preventDefault();
		const id = link.getAttribute('data-deferment-reject');
		const confirm = await Swal.fire({ title: 'Reject this leave request?', icon: 'warning', showCancelButton: true, confirmButtonColor: '#d33' });
		if (!confirm.isConfirmed) return;
		try {
			const res = await fetch(`/deferment/reject/${id}`, { method: 'POST', headers: { 'Content-Type': 'application/json' } });
			const data = await res.json().catch(()=>({}));
			if (!res.ok) throw new Error(data && data.message ? data.message : 'Failed to reject');
			// Remove the card from DOM
			const card = link.closest('.uk-card');
			const wrapper = card ? card.closest('.nature-card, .photo-card, .music-card') : null;
			if (wrapper) wrapper.remove();
			Swal.fire({ title: 'Rejected', icon: 'success', timer: 1200, showConfirmButton: false });
		} catch (err) {
			Swal.fire({ title: 'Error', text: String(err.message || err), icon: 'error' });
		}
	});
})();

// ---- Deferments: Approve via Fetch (no reload) ----
(function setupDefermentApproveAjax(){
	document.addEventListener('click', async function(e){
		const link = e.target.closest('[data-deferment-approve]');
		if (!link) return;
		e.preventDefault();
		const id = link.getAttribute('data-deferment-approve');
		try {
			const res = await fetch(`/deferment/approve/${id}`, { method: 'POST', headers: { 'Content-Type': 'application/json' } });
			const data = await res.json().catch(()=>({}));
			if (!res.ok) throw new Error(data && data.message ? data.message : 'Failed to approve');
			// Toggle card to Approved (no deletion)
			const card = link.closest('.uk-card');
			const wrapper = card ? card.closest('.nature-card, .photo-card, .music-card') : null;
			if (wrapper) {
				wrapper.classList.remove('photo-card');
				wrapper.classList.add('music-card');
				const statusSpan = wrapper.querySelector('.cat-txt');
				if (statusSpan) statusSpan.textContent = 'Approved';
			}
			Swal.fire({ title: 'Approved', icon: 'success', timer: 1200, showConfirmButton: false });
		} catch (err) {
			Swal.fire({ title: 'Error', text: String(err.message || err), icon: 'error' });
		}
	});
})();

// ---- Classes: Create via Fetch (no reload) ----
(function setupClassCreateAjax() {
	const classModalForm = document.querySelector('#modal-center1 form[action="/classes"]');
	if (!classModalForm) return;

	function getClassesListEl() {
		// Target the classes section list specifically (IDs are reused elsewhere)
		return document.querySelector('#classes #homeClassCards');
	}

	function renderClassCardHtml(clas) {
		const created = new Date(clas.createdAt || Date.now()).toLocaleDateString();
		return `
			<div class="uk-card uk-card-small uk-card-default ">
				<div class="uk-card-header">
					<div class="uk-grid uk-grid-small uk-text-small" data-uk-grid>
						<div class="uk-width-expand">
							<span class="cat-txt"> ${clas.className} </span>
						</div>
						<div class="uk-width-auto uk-text-right uk-text-muted" title="Date Created" data-uk-tooltip>
							<span data-uk-icon="icon:clock; ratio: 0.8"></span> ${created}
						</div>
					</div>
				</div>
				<div class="uk-card-footer">
					<div class="uk-grid uk-grid-small uk-grid-divider uk-flex uk-flex-middle" data-uk-grid>
						<div class="uk-width-auto uk-text-right ms-auto">
							<form id="${clas._id}" action="/classes/delete/${clas._id}" method="post">
								<button type="button" class="uk-icon-link" title="Remove Class" data-uk-tooltip data-uk-icon="icon: trash" onclick="confirmClassDelete('${clas._id}')"></button>
							</form>
						</div>
					</div>
				</div>
			</div>`;
	}

	classModalForm.addEventListener('submit', async function (e) {
		e.preventDefault();
		const classNameInput = classModalForm.querySelector('#className');
		const className = (classNameInput && classNameInput.value || '').trim();
		if (!className) {
			return Swal.fire({ title: 'Class name required', icon: 'warning' });
		}

		try {
			const res = await fetch('/classes', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ className })
			});
			const data = await res.json().catch(() => ({}));
			if (!res.ok) throw new Error(data && data.message ? data.message : 'Failed to create class');

			const list = getClassesListEl();
			if (list) {
				const item = document.createElement('div');
				item.className = 'nature-card';
				item.innerHTML = renderClassCardHtml(data.class);
				list.prepend(item);
			}

			// Reset input and close modal
			if (classNameInput) classNameInput.value = '';
			if (window.UIkit && UIkit.modal) {
				try { UIkit.modal('#modal-center1').hide(); } catch(_) {}
			}
			Swal.fire({ title: 'Class created', icon: 'success', timer: 1200, showConfirmButton: false });
		} catch (err) {
			console.error('Create class failed:', err);
			Swal.fire({ title: 'Error', text: String(err.message || err), icon: 'error' });
		}
	});
})();

// ---- Lecturers: Add/Delete/Password via Fetch ----
(function setupLecturersAjax(){
	const addForm = document.querySelector('#addLectureModal form[action="/teachers/add"]');
	const lecturersList = document.querySelector('#Lecturers #homeClassCards');

	function renderLecturerCardHtml(t){
		const created = new Date(t.createdAt || Date.now()).toLocaleDateString();
		return `
		<div class="uk-card uk-card-small uk-card-default">
			<div class="uk-card-header">
				<div class="uk-grid uk-grid-small uk-text-small" data-uk-grid>
					<div class="uk-width-expand"><span class="cat-txt">Lecturer</span></div>
					<div class="uk-width-auto uk-text-right uk-text-muted" title="Joined" data-uk-tooltip>
						<span data-uk-icon="icon:clock; ratio: 0.8"></span> ${created}
					</div>
				</div>
			</div>
			<div class="uk-card-body"><h6 class="uk-margin-small-bottom uk-margin-remove-adjacent uk-text-bold">${t.username}</h6></div>
			<div class="uk-card-footer">
				<div class="uk-grid uk-grid-small uk-grid-divider uk-flex uk-flex-middle" data-uk-grid>
					<div class="uk-width-auto uk-text-right ms-auto">
						<div class="uk-inline">
							<a data-uk-icon="icon:more-vertical"></a>
							<div data-uk-dropdown="mode: click; pos:top-right">
								<ul class="uk-nav uk-dropdown-nav">
									<li class="uk-nav-header text-center">Actions</li>
									<li>
										<a href="#" data-bs-toggle="collapse" data-bs-target="#changeTeacherPwd-${t._id}">
											<span data-uk-icon="icon: lifesaver; ratio: 0.9"></span> Change Password
										</a>
										<div id="changeTeacherPwd-${t._id}" class="collapse mt-2">
											<form data-teacher-password="${t._id}" action="/teachers/${t._id}/password" method="post" class="d-flex gap-2 align-items-center">
												<input type="password" class="form-control form-control-sm" name="password" placeholder="New password" required />
												<button type="submit" class="btn btn-sm btn-primary">Update</button>
											</form>
										</div>
									</li>
									<li>
										<a href="#" class="uk-text-danger">
											<span data-uk-icon="icon: trash; ratio: 0.9"></span>
											<form id="deletelec-${t._id}" action="/teachers/delete/${t._id}" method="post">
												<button type="button" class="uk-icon-link btn btn-outline-danger" title="Remove Lecturer" data-uk-tooltip onclick="confirmLecturerDelete('deletelec-${t._id}')">Delete Lecturer</button>
											</form>
										</a>
									</li>
								</ul>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>`;
	}

	if (addForm && lecturersList) {
		addForm.addEventListener('submit', async function(e){
			e.preventDefault();
			const username = addForm.querySelector('#username')?.value?.trim();
			const password = addForm.querySelector('#password')?.value?.trim();
			if (!username || !password) return Swal.fire({ title: 'Username and password required', icon: 'warning' });
			try {
				const res = await fetch('/teachers/add', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, password }) });
				const data = await res.json().catch(()=>({}));
				if (!res.ok) throw new Error(data && data.message ? data.message : 'Failed to add lecturer');
				const wrap = document.createElement('div');
				wrap.className = 'nature-card';
				wrap.innerHTML = renderLecturerCardHtml(data.teacher);
				lecturersList.prepend(wrap);
				addForm.reset();
				const modalEl = document.getElementById('addLectureModal');
				if (modalEl) try { bootstrap.Modal.getInstance(modalEl)?.hide(); } catch {}
				Swal.fire({ title: 'Lecturer added', icon: 'success', timer: 1200, showConfirmButton: false });
			} catch (err) {
				Swal.fire({ title: 'Error', text: String(err.message || err), icon: 'error' });
			}
		});
	}

	// Delete via fetch
	window.confirmLecturerDelete = async function(formId){
		const confirm = await Swal.fire({ title: 'Delete this lecturer?', icon: 'warning', showCancelButton: true, confirmButtonColor: '#d33' });
		if (!confirm.isConfirmed) return;
		const form = document.getElementById(formId);
		if (!form) return;
		try {
			const res = await fetch(form.action, { method: 'POST', headers: { 'Content-Type': 'application/json' } });
			const data = await res.json().catch(()=>({}));
			if (!res.ok) throw new Error(data && data.message ? data.message : 'Failed to delete lecturer');
			const card = form.closest('.uk-card');
			const wrapper = card ? card.closest('.nature-card') : null;
			if (wrapper) wrapper.remove();
			Swal.fire({ title: 'Deleted', icon: 'success', timer: 1200, showConfirmButton: false });
		} catch (err) {
			Swal.fire({ title: 'Error', text: String(err.message || err), icon: 'error' });
		}
	}

	// Password update via fetch (event delegation)
	document.addEventListener('submit', async function(e){
		const target = e.target;
		if (!(target instanceof HTMLFormElement)) return;
		const action = target.getAttribute('action') || '';
		const idAttr = target.getAttribute('data-teacher-password');
		const isTeacherPwdAction = action.includes('/teachers/') && action.includes('/password');
		const teacherId = idAttr || (isTeacherPwdAction ? (action.split('/')[2] || null) : null);
		if (!teacherId) return; // not our form
		e.preventDefault();
		const password = target.querySelector('input[name="password"]')?.value?.trim();
		if (!password) return Swal.fire({ title: 'Password required', icon: 'warning' });
		try {
			const res = await fetch(`/teachers/${teacherId}/password`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password }) });
			const data = await res.json().catch(()=>({}));
			if (!res.ok) throw new Error(data && (data.error || data.message) ? (data.error || data.message) : 'Failed to update password');
			target.reset();
			Swal.fire({ title: 'Updated', icon: 'success', timer: 1200, showConfirmButton: false });
		} catch (err) {
			Swal.fire({ title: 'Error', text: String(err.message || err), icon: 'error' });
		}
	});
})();

// ---- Students: Add/Delete/Password via Fetch ----
(function setupStudentsAjax(){
	const addForm = document.querySelector('#addStudentModal form[action="/students/add"]');
	const studentsList = document.querySelector('#StudentList #homeClassCards');

	function renderStudentCardHtml(s){
		const created = new Date(s.createdAt || Date.now()).toLocaleDateString();
		return `
		<div class="uk-card uk-card-small uk-card-default">
			<div class="uk-card-header">
				<div class="uk-grid uk-grid-small uk-text-small" data-uk-grid>
					<div class="uk-width-expand"><span class="cat-txt">Student</span></div>
					<div class="uk-width-auto uk-text-right uk-text-muted" title="Joined" data-uk-tooltip>
						<span data-uk-icon="icon:clock; ratio: 0.8"></span> ${created}
					</div>
				</div>
			</div>
			<div class="uk-card-body"><h6 class="uk-margin-small-bottom uk-margin-remove-adjacent uk-text-bold">${s.username}</h6></div>
			<div class="uk-card-footer">
				<div class="uk-grid uk-grid-small uk-grid-divider uk-flex uk-flex-middle" data-uk-grid>
					<div class="uk-width-auto uk-text-right ms-auto">
						<div class="uk-inline">
							<a data-uk-icon="icon:more-vertical"></a>
							<div data-uk-dropdown="mode: click; pos:top-right">
								<ul class="uk-nav uk-dropdown-nav">
									<li class="uk-nav-header text-center">Actions</li>
									<li>
										<a href="#" data-bs-toggle="collapse" data-bs-target="#changeStudentPwd-${s._id}">
											<span data-uk-icon="icon: lifesaver; ratio: 0.9"></span> Change Password
										</a>
										<div id="changeStudentPwd-${s._id}" class="collapse mt-2">
											<form data-student-password="${s._id}" action="/students/${s._id}/password" method="post" class="d-flex gap-2 align-items-center">
												<input type="password" class="form-control form-control-sm" name="password" placeholder="New password" required />
												<button type="submit" class="btn btn-sm btn-primary">Update</button>
											</form>
										</div>
									</li>
									<li>
										<a href="#" class="uk-text-danger">
											<span data-uk-icon="icon: trash; ratio: 0.9"></span>
											<form id="deleteStudent-${s._id}" action="/students/delete/${s._id}" method="post">
												<button type="button" class="uk-icon-link btn btn-outline-danger" title="Remove Student" data-uk-tooltip onclick="confirmStudentDelete('deleteStudent-${s._id}')">Delete Student</button>
											</form>
										</a>
									</li>
								</ul>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>`;
	}

	if (addForm && studentsList) {
		addForm.addEventListener('submit', async function(e){
			e.preventDefault();
			const username = addForm.querySelector('#username')?.value?.trim();
			const password = addForm.querySelector('#password')?.value?.trim();
			if (!username || !password) return Swal.fire({ title: 'Username and password required', icon: 'warning' });
			try {
				const res = await fetch('/students/add', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, password }) });
				const data = await res.json().catch(()=>({}));
				if (!res.ok) throw new Error(data && data.message ? data.message : 'Failed to add student');
				const wrap = document.createElement('div');
				wrap.className = 'nature-card';
				wrap.innerHTML = renderStudentCardHtml(data.student);
				studentsList.prepend(wrap);
				addForm.reset();
				const modalEl = document.getElementById('addStudentModal');
				if (modalEl) try { bootstrap.Modal.getInstance(modalEl)?.hide(); } catch {}
				Swal.fire({ title: 'Student added', icon: 'success', timer: 1200, showConfirmButton: false });
			} catch (err) {
				Swal.fire({ title: 'Error', text: String(err.message || err), icon: 'error' });
			}
		});
	}

	window.confirmStudentDelete = async function(formId){
		const confirm = await Swal.fire({ title: 'Delete this student?', icon: 'warning', showCancelButton: true, confirmButtonColor: '#d33' });
		if (!confirm.isConfirmed) return;
		const form = document.getElementById(formId);
		if (!form) return;
		try {
			const res = await fetch(form.action, { method: 'POST', headers: { 'Content-Type': 'application/json' } });
			const data = await res.json().catch(()=>({}));
			if (!res.ok) throw new Error(data && data.message ? data.message : 'Failed to delete student');
			const card = form.closest('.uk-card');
			const wrapper = card ? card.closest('.nature-card') : null;
			if (wrapper) wrapper.remove();
			Swal.fire({ title: 'Deleted', icon: 'success', timer: 1200, showConfirmButton: false });
		} catch (err) {
			Swal.fire({ title: 'Error', text: String(err.message || err), icon: 'error' });
		}
	}

	document.addEventListener('submit', async function(e){
		const target = e.target;
		if (!(target instanceof HTMLFormElement)) return;
		const action = target.getAttribute('action') || '';
		const idAttr = target.getAttribute('data-student-password');
		const isStudentPwdAction = action.includes('/students/') && action.includes('/password');
		const studentId = idAttr || (isStudentPwdAction ? (action.split('/')[2] || null) : null);
		if (!studentId) return;
		e.preventDefault();
		const password = target.querySelector('input[name="password"]')?.value?.trim();
		if (!password) return Swal.fire({ title: 'Password required', icon: 'warning' });
		try {
			const res = await fetch(`/students/${studentId}/password`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password }) });
			const data = await res.json().catch(()=>({}));
			if (!res.ok) throw new Error(data && (data.error || data.message) ? (data.error || data.message) : 'Failed to update password');
			target.reset();
			Swal.fire({ title: 'Updated', icon: 'success', timer: 1200, showConfirmButton: false });
		} catch (err) {
			Swal.fire({ title: 'Error', text: String(err.message || err), icon: 'error' });
		}
	});
})();
