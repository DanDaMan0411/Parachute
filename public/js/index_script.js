/*
 * Used as an onClick function for the form to 
 * view an organization's information page
 * 
 * By using parentElement, makes it more compatible 
 * when there are multiple organizations the user
 * is associated with
 */
function submitOrgInfoForm(org){
	org.parentElement.submit();
}


function deleteInboxMessage(message_id, message){
	$.post('/delete_msg',{
		message_id: message_id
	})
	
	/*
	 * Visually deletes the inbox message element
	 */
	message.parentNode.parentNode.parentNode.parentNode.parentNode.parentNode.removeChild(message.parentNode.parentNode.parentNode.parentNode.parentNode);
}
