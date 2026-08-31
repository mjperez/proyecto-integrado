export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const nombre = searchParams.get("producto")
}