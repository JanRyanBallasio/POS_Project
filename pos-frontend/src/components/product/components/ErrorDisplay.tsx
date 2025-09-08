type Props = {
    error: string | null;
};

export default function ErrorDisplay({ error }: Props) {
    if (!error) return null;

    return (
        <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
            <p className="text-sm text-red-600">{error}</p>
        </div>
    );
}