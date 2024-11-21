import { Button } from "@/components/ui/button"
import Link from "@/classes/link"

const links: Link[] = [
  {
    id: 0,
    name: "Måde 1",
    url: "/firstMethod"
  },
  {
    id: 1,
    name: "Måde 2",
    url: "/secondMethod"
  }
]

export default function Home() {
  return (
    <div>
      <h1>Frontpage</h1>

      <div className="flex justify-center align-center gap-5 w-full">
        {links.map((link) => (
          <a href={link.url} key={link.id}>
            <Button>{link.name}</Button>
          </a>
        ))}
      </div>
    </div>
  );
}
