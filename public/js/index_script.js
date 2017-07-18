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
