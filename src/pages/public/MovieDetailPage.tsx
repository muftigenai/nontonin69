import { useParams } from "react-router-dom";
const MovieDetailPage = () => {
  const { id } = useParams();
  return (
    <div>
      <h1 className="text-3xl font-bold">Detail Film</h1>
      <p className="text-muted-foreground mt-2">Menampilkan detail untuk film dengan ID: {id}</p>
      <p className="mt-4">Fitur ini sedang dalam pengembangan.</p>
    </div>
  );
};
export default MovieDetailPage;