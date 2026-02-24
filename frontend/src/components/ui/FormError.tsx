interface FormErrorProps {
	error?: string | null;
	errorId?: string;
}

export default function FormError({ error, errorId }: FormErrorProps) {
	if (!error) return null;

	return (
		<div
			className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-xl"
			role="alert"
			id={errorId}
			aria-live="polite"
		>
			<p className="text-sm font-medium">{error}</p>
		</div>
	);
}
