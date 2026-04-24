import { useEffect, useRef, useState } from "react";

const EMOJIS: { emoji: string; name: string }[] = [
  // Smileys
  { emoji: "😀", name: "grin happy smile" },
  { emoji: "😃", name: "smile happy open" },
  { emoji: "😄", name: "laugh happy eyes" },
  { emoji: "😁", name: "beam grin teeth" },
  { emoji: "😆", name: "laughing squint" },
  { emoji: "😅", name: "sweat smile nervous" },
  { emoji: "🤣", name: "rofl laugh rolling" },
  { emoji: "😂", name: "joy tears laugh" },
  { emoji: "🙂", name: "slight smile" },
  { emoji: "😉", name: "wink" },
  { emoji: "😊", name: "blush happy warm" },
  { emoji: "😇", name: "angel halo innocent" },
  { emoji: "😍", name: "heart eyes love" },
  { emoji: "🤩", name: "star struck excited" },
  { emoji: "😎", name: "cool sunglasses" },
  { emoji: "🤔", name: "thinking hmm wonder" },
  { emoji: "🤗", name: "hug warm embrace" },
  { emoji: "😤", name: "angry huff steam" },
  { emoji: "😱", name: "scream shock horror" },
  { emoji: "🥳", name: "party celebrate birthday" },
  // Gestures
  { emoji: "👍", name: "thumbs up approve good" },
  { emoji: "👎", name: "thumbs down disapprove bad" },
  { emoji: "👏", name: "clap applause bravo" },
  { emoji: "🙌", name: "raised hands celebrate hooray" },
  { emoji: "🤝", name: "handshake deal agreement" },
  { emoji: "✌️", name: "peace victory two" },
  { emoji: "💪", name: "muscle strong flex power" },
  { emoji: "🙏", name: "pray please hope thanks" },
  { emoji: "👋", name: "wave hello goodbye" },
  { emoji: "✋", name: "hand stop raise high five" },
  // People
  { emoji: "👤", name: "user person profile silhouette" },
  { emoji: "👥", name: "group team people users" },
  { emoji: "👨‍💻", name: "developer programmer coder technologist" },
  { emoji: "👩‍💻", name: "developer programmer coder woman technologist" },
  { emoji: "👨‍💼", name: "business man office worker" },
  { emoji: "👩‍💼", name: "business woman office worker" },
  { emoji: "👨‍🔬", name: "scientist man research" },
  { emoji: "👩‍🎓", name: "student graduate woman education" },
  { emoji: "🧑‍🤝‍🧑", name: "people together couple pair" },
  { emoji: "👶", name: "baby child infant" },
  // Animals
  { emoji: "🐶", name: "dog puppy pet" },
  { emoji: "🐱", name: "cat kitten pet" },
  { emoji: "🐻", name: "bear animal" },
  { emoji: "🦊", name: "fox clever" },
  { emoji: "🐼", name: "panda bear" },
  { emoji: "🦁", name: "lion king brave" },
  { emoji: "🐸", name: "frog deploy friday" },
  { emoji: "🦄", name: "unicorn magic special" },
  { emoji: "🐝", name: "bee busy working" },
  { emoji: "🦋", name: "butterfly transform change" },
  // Nature
  { emoji: "🌍", name: "globe world earth international europe africa" },
  { emoji: "🌎", name: "globe world earth americas" },
  { emoji: "🌏", name: "globe world earth asia australia" },
  { emoji: "🌐", name: "network web internet globe meridians" },
  { emoji: "🌞", name: "sun sunny bright" },
  { emoji: "🌙", name: "moon night crescent" },
  { emoji: "⭐", name: "star favorite important" },
  { emoji: "🌟", name: "glowing star sparkle shine" },
  { emoji: "✨", name: "sparkles magic new shiny" },
  { emoji: "🔥", name: "fire hot trending popular" },
  { emoji: "⚡", name: "lightning fast speed electric zap" },
  { emoji: "🌈", name: "rainbow colorful diversity" },
  { emoji: "☁️", name: "cloud weather hosting" },
  { emoji: "🌊", name: "wave ocean water" },
  { emoji: "🌲", name: "tree evergreen nature" },
  { emoji: "🌸", name: "cherry blossom flower spring" },
  // Food
  { emoji: "🍕", name: "pizza food" },
  { emoji: "🍔", name: "hamburger burger food" },
  { emoji: "☕", name: "coffee hot beverage cafe" },
  { emoji: "🍺", name: "beer mug drink" },
  { emoji: "🎂", name: "birthday cake celebration" },
  { emoji: "🍎", name: "apple red fruit" },
  { emoji: "🍪", name: "cookie sweet snack" },
  { emoji: "🧁", name: "cupcake dessert treat" },
  // Objects
  { emoji: "💡", name: "idea lightbulb bright think" },
  { emoji: "🔑", name: "key access credential password" },
  { emoji: "🔒", name: "lock security private closed" },
  { emoji: "🔓", name: "unlock open public" },
  { emoji: "🔗", name: "link chain connect url" },
  { emoji: "📎", name: "paperclip attach" },
  { emoji: "📌", name: "pin pushpin location" },
  { emoji: "🔔", name: "bell notification alert ring" },
  { emoji: "🔕", name: "bell mute silent no notification" },
  { emoji: "📢", name: "megaphone announce loudspeaker" },
  { emoji: "📣", name: "cheering megaphone announce" },
  { emoji: "💬", name: "chat message comment speech bubble" },
  { emoji: "💭", name: "thought bubble think idea" },
  { emoji: "🏷️", name: "tag label price" },
  { emoji: "📦", name: "package box delivery shipping" },
  { emoji: "🎁", name: "gift present wrapped" },
  { emoji: "🛒", name: "cart shopping ecommerce" },
  { emoji: "💳", name: "credit card payment checkout" },
  { emoji: "💰", name: "money bag finance rich" },
  { emoji: "💵", name: "dollar money cash bill" },
  { emoji: "💶", name: "euro money currency" },
  { emoji: "💷", name: "pound money sterling" },
  { emoji: "🏦", name: "bank institution finance" },
  { emoji: "💎", name: "gem diamond premium luxury" },
  { emoji: "⏰", name: "alarm clock time wake" },
  { emoji: "⏱️", name: "timer stopwatch time duration" },
  { emoji: "📅", name: "calendar date schedule event" },
  { emoji: "📆", name: "calendar tear off date" },
  { emoji: "🎯", name: "target goal bullseye aim direct hit" },
  { emoji: "🧲", name: "magnet attract" },
  { emoji: "🧰", name: "toolbox tools repair kit" },
  { emoji: "🔧", name: "wrench tool fix repair settings" },
  { emoji: "🔨", name: "hammer tool build construct" },
  { emoji: "⚙️", name: "gear settings config cog mechanism" },
  { emoji: "🛡️", name: "shield protect guard security defense" },
  { emoji: "⚔️", name: "crossed swords battle fight" },
  { emoji: "🏆", name: "trophy winner champion award" },
  { emoji: "🥇", name: "gold medal first place winner" },
  { emoji: "🎮", name: "game controller gaming play" },
  { emoji: "🎲", name: "dice game random chance" },
  { emoji: "🧩", name: "puzzle piece integration fit" },
  { emoji: "🎨", name: "art palette design creative color" },
  { emoji: "🖼️", name: "frame picture image gallery" },
  { emoji: "🎬", name: "clapper movie film video" },
  { emoji: "🎵", name: "music note song audio" },
  { emoji: "🎤", name: "microphone sing karaoke voice" },
  // Tech
  { emoji: "💻", name: "laptop computer work" },
  { emoji: "🖥️", name: "desktop computer monitor screen" },
  { emoji: "📱", name: "mobile phone smartphone app" },
  { emoji: "⌨️", name: "keyboard type input" },
  { emoji: "🖱️", name: "mouse click computer" },
  { emoji: "🔌", name: "plug electric power connect" },
  { emoji: "💾", name: "floppy disk save storage" },
  { emoji: "💿", name: "cd disc optical" },
  { emoji: "🤖", name: "robot automation bot ai artificial" },
  { emoji: "🧠", name: "brain smart think intelligence" },
  { emoji: "🛸", name: "ufo flying saucer alien" },
  // Documents
  { emoji: "📋", name: "clipboard list task checklist" },
  { emoji: "📝", name: "memo note write edit document" },
  { emoji: "📄", name: "page document file" },
  { emoji: "📃", name: "page curl document" },
  { emoji: "📑", name: "bookmark tabs document" },
  { emoji: "📊", name: "chart bar analytics statistics" },
  { emoji: "📈", name: "chart trending up growth increase" },
  { emoji: "📉", name: "chart trending down decline decrease" },
  { emoji: "🗂️", name: "folder file organize dividers" },
  { emoji: "📁", name: "folder file directory" },
  { emoji: "📂", name: "folder open file" },
  { emoji: "🗃️", name: "card file box database storage archive" },
  { emoji: "📧", name: "email mail envelope message" },
  { emoji: "📤", name: "upload outbox send export" },
  { emoji: "📥", name: "download inbox receive import" },
  { emoji: "🔍", name: "search magnify find look left" },
  { emoji: "🔎", name: "search magnify find look right" },
  // Symbols
  { emoji: "✅", name: "check done complete success yes" },
  { emoji: "❌", name: "cross cancel error delete no" },
  { emoji: "⚠️", name: "warning alert caution" },
  { emoji: "🚫", name: "prohibited forbidden ban no" },
  { emoji: "❗", name: "exclamation important urgent" },
  { emoji: "❓", name: "question help ask" },
  { emoji: "💯", name: "hundred perfect score" },
  { emoji: "♻️", name: "recycle green environment reuse" },
  { emoji: "🔄", name: "refresh sync cycle repeat arrows" },
  { emoji: "➡️", name: "arrow right next forward" },
  { emoji: "⬅️", name: "arrow left back previous" },
  { emoji: "⬆️", name: "arrow up increase" },
  { emoji: "⬇️", name: "arrow down decrease" },
  { emoji: "🔀", name: "shuffle random mix" },
  { emoji: "🔁", name: "repeat loop cycle" },
  { emoji: "ℹ️", name: "info information" },
  // Travel & Places
  { emoji: "🚀", name: "rocket launch deploy ship" },
  { emoji: "✈️", name: "airplane flight travel" },
  { emoji: "🚗", name: "car automobile vehicle" },
  { emoji: "🚕", name: "taxi cab ride" },
  { emoji: "🚢", name: "ship boat cruise" },
  { emoji: "🏠", name: "home house" },
  { emoji: "🏢", name: "office building company" },
  { emoji: "🏥", name: "hospital medical health" },
  { emoji: "🏫", name: "school education" },
  { emoji: "🏪", name: "convenience store shop" },
  { emoji: "🗺️", name: "world map travel atlas" },
  { emoji: "🧭", name: "compass navigate direction" },
  // Celebration
  { emoji: "🎉", name: "party tada celebration confetti" },
  { emoji: "🎊", name: "confetti ball celebration" },
  { emoji: "🎈", name: "balloon party celebration" },
  { emoji: "🎆", name: "fireworks celebration night" },
  { emoji: "🎇", name: "sparkler celebration" },
  { emoji: "🎎", name: "dolls festival" },
  { emoji: "🎓", name: "graduation education learn cap" },
  // Science
  { emoji: "🧪", name: "test tube experiment science lab" },
  { emoji: "🔬", name: "microscope science research lab" },
  { emoji: "🔭", name: "telescope space astronomy observe" },
  { emoji: "🧬", name: "dna genetics biology science" },
  { emoji: "⚗️", name: "alembic chemistry experiment" },
  { emoji: "🧫", name: "petri dish biology lab culture" },
  // Flags
  { emoji: "🏳️", name: "white flag surrender" },
  { emoji: "🏴", name: "black flag" },
  { emoji: "🚩", name: "red flag triangular" },
  { emoji: "🏁", name: "checkered flag finish race" },
];

interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
  onClose: () => void;
}

export function EmojiPicker({ onSelect, onClose }: EmojiPickerProps) {
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = search
    ? EMOJIS.filter((e) => e.name.toLowerCase().includes(search.toLowerCase()))
    : EMOJIS;

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="absolute left-0 top-8 z-50 overflow-hidden rounded-lg bg-zinc-800 shadow-xl ring-1 ring-zinc-600"
      style={{ width: "320px" }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="border-b border-zinc-700 p-2">
        <input
          ref={inputRef}
          className="w-full rounded bg-zinc-900 px-2 py-1.5 text-sm text-zinc-100 outline-none ring-1 ring-zinc-700 placeholder:text-zinc-500"
          placeholder="Search emoji..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      <div
        className="overflow-y-auto overflow-x-hidden p-2"
        style={{ maxHeight: "300px" }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(8, 1fr)",
            gap: "2px",
          }}
        >
          {filtered.map((e) => (
            <button
              key={e.emoji}
              className="flex items-center justify-center rounded text-xl hover:bg-zinc-700"
              style={{ aspectRatio: "1", width: "100%" }}
              onClick={() => onSelect(e.emoji)}
              title={e.name}
            >
              {e.emoji}
            </button>
          ))}
        </div>
        {filtered.length === 0 && (
          <p className="py-4 text-center text-xs text-zinc-500">
            No emojis found
          </p>
        )}
      </div>
    </div>
  );
}
