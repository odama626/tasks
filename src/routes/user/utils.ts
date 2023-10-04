import { goto } from '$app/navigation';

export function handleRedirect() {
	const redirect = localStorage.getItem('login-redirect') ?? '/';
	localStorage.removeItem('login-redirect');
	goto(redirect);
}

export function createRedirect(url: { search: string; pathname: string }) {
	const returnUrl = url.pathname + url.search;
	globalThis?.localStorage?.setItem('login-redirect', returnUrl);
}
