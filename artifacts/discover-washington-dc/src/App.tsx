import { useState } from 'react';
import ChatGuide from "./ChatGuide";
import DishGallery from "./DishGallery";
import {
  ArrowDown,
  ArrowRight,
  BusFront,
  Compass,
  Landmark,
  Menu,
  Mountain,
  Orbit,
  Search,
  ShoppingBasket,
  Sparkles,
  Ticket,
  Utensils,
  X,
} from 'lucide-react';

type Attraction = {
  name: string;
  kind: string;
  description: string;
  symbol: typeof Landmark;
};

type GuideSearchItem = {
  id: string;
  title: string;
  category: string;
  summary: string;
  href: string;
  keywords: string;
};

const guideSearchItems: GuideSearchItem[] = [
  {
    id: 'white-house',
    title: 'The White House',
    category: 'Landmark',
    summary: 'See it from Lafayette Square; tours require advance planning.',
    href: '#landmarks',
    keywords: 'president pennsylvania avenue civic',
  },
  {
    id: 'lincoln-memorial',
    title: 'Lincoln Memorial',
    category: 'Landmark',
    summary: 'A memorable stop at the western end of the National Mall.',
    href: '#landmarks',
    keywords: 'reflecting pool monument history',
  },
  {
    id: 'washington-monument',
    title: 'Washington Monument',
    category: 'Landmark',
    summary: 'The obelisk at the heart of the National Mall.',
    href: '#landmarks',
    keywords: 'obelisk ticket national mall',
  },
  {
    id: 'smithsonian',
    title: 'Smithsonian museums',
    category: 'Museums',
    summary: 'Explore art, history, science, air and space, and more.',
    href: '#museums',
    keywords: 'free museum natural history air space african american',
  },
  {
    id: 'ethiopian-food',
    title: 'Ethiopian food',
    category: 'Food',
    summary: 'Try injera and shared dishes around Shaw and U Street.',
    href: '#food',
    keywords: 'injera stew dinner restaurant',
  },
  {
    id: 'half-smoke',
    title: 'DC half-smoke',
    category: 'Food',
    summary: 'A smoky local sausage, with Ben’s Chili Bowl as a classic stop.',
    href: '#food',
    keywords: 'sausage bens chili bowl u street',
  },
  {
    id: 'food-markets',
    title: 'Eastern Market and Union Market',
    category: 'Food markets',
    summary: 'Browse neighborhood vendors, food stalls, and makers.',
    href: '#food',
    keywords: 'market capitol hill noma food stalls',
  },
  {
    id: 'georgetown',
    title: 'Georgetown',
    category: 'Neighborhood',
    summary: 'Walk historic streets, independent shops, and the waterfront.',
    href: '#neighborhoods',
    keywords: 'shops water river shopping',
  },
  {
    id: 'u-street',
    title: 'U Street',
    category: 'Neighborhood',
    summary: 'Discover live music, local restaurants, and Black history.',
    href: '#neighborhoods',
    keywords: 'music culture black history community',
  },
  {
    id: 'dc-communities',
    title: 'DC’s diverse communities',
    category: 'Culture',
    summary: 'Explore the city respectfully and support local businesses.',
    href: '#neighborhoods',
    keywords: 'culture diversity communities local businesses',
  },
  {
    id: 'free-museums',
    title: 'Free museums',
    category: 'Visitor tip',
    summary: 'Many Smithsonian museums and the National Gallery are free.',
    href: '#plan',
    keywords: 'admission cost free Smithsonian',
  },
  {
    id: 'metro',
    title: 'Metro transportation',
    category: 'Visitor tip',
    summary: 'Use Metrorail and Metrobus; check current fares and service.',
    href: '#plan',
    keywords: 'transit bus train smartrip wmata',
  },
  {
    id: 'seasons',
    title: 'Best seasons to visit',
    category: 'Visitor tip',
    summary: 'Spring brings blossoms; fall is great for comfortable walks.',
    href: '#plan',
    keywords: 'spring fall autumn cherry blossoms weather summer winter',
  },
];

const normalizeSearchText = (value: string) =>
  value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

const attractions: Attraction[] = [
  {
    name: 'Lincoln Memorial',
    kind: 'The National Mall',
    description: 'Stand beneath the columns, then follow the long view across the Reflecting Pool toward the Washington Monument.',
    symbol: Landmark,
  },
  {
    name: 'Washington Monument',
    kind: 'The National Mall',
    description: 'The city’s unmistakable obelisk anchors the Mall. Check the official site for timed-entry ticket availability.',
    symbol: Mountain,
  },
  {
    name: 'Smithsonian National Museum of Natural History',
    kind: 'Museum · National Mall',
    description: 'A grand, wonderfully varied collection, from deep-time fossils to the natural world. Smithsonian museums are generally free to visit.',
    symbol: Orbit,
  },
  {
    name: 'Smithsonian National Air and Space Museum',
    kind: 'Museum · National Mall',
    description: 'Explore the story of flight and space exploration; check ahead, as free timed-entry passes may be required.',
    symbol: Orbit,
  },
  {
    name: 'National Museum of African American History and Culture',
    kind: 'Museum · National Mall',
    description: 'A moving, essential museum tracing African American history and culture. Timed-entry passes are often required.',
    symbol: Landmark,
  },
  {
    name: 'The White House',
    kind: 'Civic landmark · Lafayette Square',
    description: 'Take in the north-facing view from Lafayette Square. Public tours must be requested through a member of Congress well in advance.',
    symbol: Landmark,
  },
  {
    name: 'National Gallery of Art',
    kind: 'Museum · National Mall',
    description: 'A rich collection spanning centuries, with two buildings and a sculpture garden just off the Mall.',
    symbol: Orbit,
  },
];

const landmarkCards = [
  {
    name: 'Lincoln Memorial',
    note: 'A powerful pause at the western end of the Mall.',
    category: 'THE NATIONAL MALL',
    icon: Landmark,
  },
  {
    name: 'Washington Monument',
    note: 'The city’s skyline compass, rising above the green.',
    category: 'A CITY LANDMARK',
    icon: Mountain,
  },
  {
    name: 'The White House',
    note: 'A landmark best seen from Lafayette Square.',
    category: 'PENNSYLVANIA AVENUE',
    icon: Landmark,
  },
  {
    name: 'Smithsonian museums',
    note: 'Art, history, science and culture—many under one name.',
    category: 'MAKE A DAY OF IT',
    icon: Orbit,
  },
  {
    name: 'The National Mall',
    note: 'A walkable thread connecting monuments and museums.',
    category: 'START HERE',
    icon: Compass,
  },
];

function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [recommendation, setRecommendation] = useState<Attraction | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [submittedSearch, setSubmittedSearch] = useState('');
  const normalizedSearchQuery = normalizeSearchText(searchQuery.trim());
  const normalizedSubmittedSearch = normalizeSearchText(submittedSearch.trim());
  const searchIsReady =
    normalizedSearchQuery.length > 0 &&
    normalizedSearchQuery === normalizedSubmittedSearch;
  const searchResults = searchIsReady
    ? guideSearchItems.filter((item) =>
        normalizeSearchText(`${item.title} ${item.category} ${item.summary} ${item.keywords}`).includes(normalizedSubmittedSearch),
      )
    : [];
  const chooseSurprise = () => {
    const choices = attractions.filter((item) => item.name !== recommendation?.name);
    setRecommendation(choices[Math.floor(Math.random() * choices.length)]);
  };
  const closeMenu = () => setMenuOpen(false);

  return (
    <div className="site-shell">
      <header className="topbar">
        <div className="nav-wrap">
          <a className="brand" href="#top" aria-label="Discover Washington, DC home" onClick={closeMenu}>
            <span className="brand-mark" aria-hidden="true"><Compass size={19} strokeWidth={1.4} /></span>
            <span className="brand-name">Discover DC<span>A local’s first guide</span></span>
          </a>
          <button
            className="menu-toggle"
            type="button"
            aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={menuOpen}
            aria-controls="primary-navigation"
            onClick={() => setMenuOpen((open) => !open)}
            data-testid="mobile-menu-toggle"
          >
            {menuOpen ? <X size={23} /> : <Menu size={23} />}
          </button>
          <nav id="primary-navigation" className={`nav-links${menuOpen ? ' is-open' : ''}`} aria-label="Main navigation">
            <a href="#landmarks" onClick={closeMenu}>Must-sees</a>
            <a href="#food" onClick={closeMenu}>Eat like a local</a>
            <a href="#neighborhoods" onClick={closeMenu}>Neighborhoods</a>
            <a href="#plan" onClick={closeMenu}>Plan your visit</a>
            <a className="nav-cta" href="#plan" onClick={closeMenu}>Know before you go <ArrowRight size={14} /></a>
          </nav>
        </div>
      </header>

      <main id="top">
        <section className="hero" aria-labelledby="hero-title" data-testid="hero-section">
          <div className="hero-inner">
            <div className="eyebrow">The capital, with a little more local in it</div>
            <h1 id="hero-title">Big history.<br />Many <em>stories.</em></h1>
            <p className="hero-copy">Come for the monuments. Stay for the neighborhood tables, the free afternoons in a museum, and a city that keeps surprising you around the next corner.</p>
            <div className="hero-actions">
              <a className="button-primary" href="#landmarks">Start exploring <ArrowDown size={15} /></a>
              <button className="button-ghost" type="button" onClick={chooseSurprise} data-testid="hero-surprise-button">
                <Sparkles size={15} /> Surprise me
              </button>
            </div>
          </div>
          <div className="hero-note" aria-hidden="true">A city worth looking closer at</div>
          <div className="hero-caption">Washington, DC · Along the National Mall</div>
        </section>

        <div className="intro-strip">
          <div className="intro-inner">
            <p>Washington is more than its postcard view. Make room for the whole city.</p>
            <span className="intro-tag">Monuments to mom-and-pop tables</span>
          </div>
        </div>

        <ChatGuide />

        <section className="guide-search" aria-labelledby="guide-search-title" data-testid="guide-search-section">
          <div className="container guide-search-inner">
            <div className="guide-search-copy">
              <div className="section-kicker">Find your next stop</div>
              <h2 id="guide-search-title">Search the guide</h2>
              <p>Look up landmarks, food, neighborhoods, and trip tips.</p>
            </div>
            <div className="guide-search-main">
              <form className="guide-search-controls" onSubmit={(event) => {
                event.preventDefault();
                setSubmittedSearch(searchQuery.trim());
              }}>
              <div className="guide-search-field">
                <Search size={19} aria-hidden="true" />
                <label className="sr-only" htmlFor="guide-search-input">
                  Search landmarks, food, neighborhoods, and tips
                </label>
                <input
                  id="guide-search-input"
                  type="search"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Escape') {
                      setSearchQuery('');
                      setSubmittedSearch('');
                    }
                  }}
                  placeholder="Try “Metro” or “Ethiopian food”"
                  autoComplete="off"
                  aria-describedby="guide-search-status"
                  data-testid="search-guide-input"
                />
                {searchQuery && (
                  <button
                    className="guide-search-clear"
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setSubmittedSearch('');
                    }}
                    aria-label="Clear search"
                    data-testid="clear-guide-search"
                  >
                    <X size={16} aria-hidden="true" />
                  </button>
                )}
              </div>
              <button className="guide-search-submit" type="submit" data-testid="button-submit-guide-search">
                Search <ArrowRight size={15} aria-hidden="true" />
              </button>
              </form>
              <p className="guide-search-status" id="guide-search-status" aria-live="polite" data-testid="search-guide-status">
                {!normalizedSearchQuery
                  ? 'Search the guide to see matching stops and tips.'
                  : !searchIsReady
                    ? 'Press Search to see matching stops and tips.'
                  : searchResults.length === 1
                    ? '1 result'
                    : `${searchResults.length} results`}
              </p>
              {searchIsReady && searchResults.length > 0 && (
                <ul className="guide-search-results" data-testid="search-guide-results">
                  {searchResults.map((item) => (
                    <li key={item.id} data-testid={`search-result-${item.id}`}>
                      <a
                        href={item.href}
                        onClick={() => {
                          setSearchQuery('');
                          setSubmittedSearch('');
                        }}
                      >
                        <span className="guide-search-result-copy">
                          <span className="guide-search-result-category">{item.category}</span>
                          <span className="guide-search-result-title">{item.title}</span>
                          <span className="guide-search-result-summary">{item.summary}</span>
                        </span>
                        <ArrowRight size={16} aria-hidden="true" />
                      </a>
                    </li>
                  ))}
                </ul>
              )}
              {searchIsReady && searchResults.length === 0 && (
                <p className="guide-search-empty" data-testid="search-guide-empty">
                  No matches found. Try a landmark, food, neighborhood, or “Metro”.
                </p>
              )}
            </div>
          </div>
        </section>

        <section className="section" id="landmarks" aria-labelledby="landmarks-title" data-testid="landmarks-section">
          <div className="container">
            <div className="attractions-head">
              <div>
                <div className="section-kicker">The iconic starting line</div>
                <h2 className="section-heading" id="landmarks-title">First, the sights<br />you came for.</h2>
                <p className="section-lead">The monuments and museums are close enough to connect on foot, but give them time. The scale—and the stories—are bigger in person.</p>
              </div>
              <button className="surprise" type="button" onClick={chooseSurprise} aria-label="Choose a random Washington DC attraction" data-testid="surprise-me-button">
                <Sparkles size={16} /> Surprise me <ArrowRight size={14} />
              </button>
            </div>
            {recommendation && (
              <div className="surprise-result" role="status" aria-live="polite" data-testid="surprise-recommendation">
                <Sparkles size={19} aria-hidden="true" />
                <div>
                  <span>Your just-picked DC stop</span>
                  <strong>{recommendation.name}</strong>
                  <p>{recommendation.description}</p>
                </div>
              </div>
            )}
            <div className="landmark-grid" data-testid="landmark-grid">
              {landmarkCards.map(({ name, note, category, icon: Icon }) => (
                <article className="landmark" key={name} data-testid={`landmark-${name.toLowerCase().replaceAll(/[^a-z0-9]+/g, '-')}`}>
                  <div className="landmark-art" aria-hidden="true"><Icon /></div>
                  <div className="landmark-copy">
                    <small>{category}</small>
                    <h3>{name}</h3>
                    <p>{note}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="field-note" id="museums" aria-labelledby="field-title" data-testid="museum-section">
          <div className="container field-inner">
            <div className="field-stamp" aria-hidden="true">
              <Orbit />
              <span className="stamp-label">A museum day, your way</span>
            </div>
            <div className="field-copy">
              <div className="section-kicker">A very good kind of indoors</div>
              <h2 id="field-title">A museum city.<br />Open to everyone.</h2>
              <p>Smithsonian museums and the National Gallery of Art offer free admission, making it easy to duck in for an hour or happily lose a whole afternoon. Pick one or two; the National Mall is longer than it looks.</p>
              <div className="field-facts">
                <div className="fact"><strong>Start with a theme</strong><span>Air and space, American history, art, natural history—follow what you’re curious about.</span></div>
                <div className="fact"><strong>Check before you go</strong><span>Some museums and exhibitions use timed-entry passes. Confirm current visitor details online.</span></div>
              </div>
            </div>
          </div>
        </section>

        <section className="section food-section" id="food" aria-labelledby="food-title" data-testid="food-section">
          <div className="container food-layout">
            <div className="food-title">
              <div className="section-kicker">Come hungry, leave curious</div>
              <h2 className="section-heading" id="food-title">The city’s best<br />stories are served.</h2>
              <p className="section-lead">DC’s food scene is shaped by the people who call it home. Start with a local classic, then follow your appetite.</p>
            </div>
            <div className="food-list">
              <article className="food-item" data-testid="food-ethiopian">
                <span className="food-number">01</span>
                <div><h3>Ethiopian, shared around the table</h3><p>In a city with a vibrant Ethiopian community, look for injera, richly seasoned stews and meals made for sharing. Shaw and nearby corridors are a good place to explore.</p><span className="food-chip">Shaw · U Street</span></div>
              </article>
              <article className="food-item" data-testid="food-half-smoke">
                <span className="food-number">02</span>
                <div><h3>The half-smoke: a DC original</h3><p>A smoky, spiced sausage in a bun is the city’s signature street-food order. Ben’s Chili Bowl on U Street is the storied address most visitors know.</p><span className="food-chip">U Street classic</span></div>
              </article>
              <article className="food-item" data-testid="food-markets">
                <span className="food-number">03</span>
                <div><h3>Markets made for wandering</h3><p>Eastern Market brings a neighborhood feel to Capitol Hill; Union Market gathers food stalls and makers in a lively modern hall. Check hours before heading over.</p><span className="food-chip">Capitol Hill · NoMa</span></div>
              </article>
              <article className="food-item" data-testid="food-more">
                <span className="food-number">04</span>
                <div><h3>Keep the table open</h3><p>From go-go-era carryouts to Salvadoran pupusas, Korean bakeries and inventive small plates, DC’s mix of communities makes every meal an invitation.</p><span className="food-chip">A city of many kitchens</span></div>
              </article>
            </div>
          </div>
        </section>

        <section className="section neighborhood-section" id="neighborhoods" aria-labelledby="neighborhood-title" data-testid="neighborhoods-section">
          <div className="container">
            <div className="neighborhood-head">
              <div>
                <div className="section-kicker">Beyond the postcard</div>
                <h2 className="section-heading" id="neighborhood-title">Find your own<br />corner of DC.</h2>
              </div>
              <p className="section-lead">Each neighborhood has its own rhythm. Take the Metro, get off somewhere new, and see what’s happening at street level.</p>
            </div>
            <div className="neighborhood-grid">
              <article className="neighborhood" data-testid="neighborhood-georgetown">
                <span className="neighborhood-index">01 / BY THE WATER</span>
                <h3>Georgetown</h3>
                <p>Historic brick streets, independent shops and a lively waterfront. Come for a stroll; stay for the river light.</p>
              </article>
              <article className="neighborhood" data-testid="neighborhood-u-street">
                <span className="neighborhood-index">02 / SOUND & SOUL</span>
                <h3>U Street</h3>
                <p>A historic Black cultural corridor with live music, local restaurants and stories in every block.</p>
              </article>
              <article className="neighborhood" data-testid="neighborhood-museums">
                <span className="neighborhood-index">03 / MAKE A DAY OF IT</span>
                <h3>Museum neighborhoods</h3>
                <p>Start on the Mall, then cross into Penn Quarter or the Wharf for galleries, restaurants and a different view of the city.</p>
              </article>
            </div>
            <div className="community-note"><Compass size={18} aria-hidden="true" /><span>DC is home to communities from around the world and a deep, living Black history. Be a thoughtful guest: support local businesses, learn the stories, and explore beyond the monuments.</span></div>
          </div>
        </section>

        <section className="section plan-section" id="plan" aria-labelledby="plan-title" data-testid="planning-section">
          <div className="container">
            <div className="plan-header">
              <div className="section-kicker">A little local know-how</div>
              <h2 className="section-heading" id="plan-title">Make the most of<br />your time here.</h2>
              <p className="section-lead">A few practical notes to keep the day easy, whether you’re here for a long weekend or a longer look.</p>
            </div>
            <div className="plan-grid">
              <article className="plan-card" data-testid="plan-free-museums">
                <Ticket className="plan-icon" aria-hidden="true" />
                <h3>Free, remarkable museums</h3>
                <p><strong>Many Smithsonian museums and the National Gallery of Art are free.</strong> Check current hours and whether timed-entry passes are needed, especially for popular museums and busy dates.</p>
              </article>
              <article className="plan-card" data-testid="plan-metro">
                <BusFront className="plan-icon" aria-hidden="true" />
                <h3>Metro makes it simple</h3>
                <p>Use Metrorail and Metrobus to get around, with contactless payment or a SmarTrip card. Fares vary by trip and time; check WMATA for current fares, service and trip planning.</p>
              </article>
              <article className="plan-card" data-testid="plan-seasons">
                <ShoppingBasket className="plan-icon" aria-hidden="true" />
                <h3>Pick your season</h3>
                <p><strong>Spring</strong> brings cherry blossoms and big crowds. <strong>Fall</strong> is a favorite for comfortable walks. Summer is lively but hot and humid; winter is quieter, with chilly days.</p>
              </article>
            </div>
            <div className="plan-footer">
              <p>Plans change—check official attraction and transit sites for the latest details.</p>
              <a href="https://www.wmata.com/" target="_blank" rel="noreferrer">Plan a Metro trip <ArrowRight size={14} /></a>
            </div>
          </div>
        </section>

        <DishGallery />

        <section className="closing" aria-label="Explore Washington DC">
          <div className="container closing-inner">
            <div><h2>Bring your curiosity.<br />DC will take it from there.</h2><p>Make a little room in the itinerary for the unexpected.</p></div>
            <a href="#landmarks">Explore the guide <ArrowRight size={15} /></a>
          </div>
        </section>
      </main>

      <footer>
        <div className="footer-inner">
          <a className="brand" href="#top" aria-label="Back to top">
            <span className="brand-mark" aria-hidden="true"><Compass size={18} strokeWidth={1.4} /></span>
            <span className="brand-name">Discover DC<span>A local’s first guide</span></span>
          </a>
          <span>Made for the curious visitor · Washington, DC</span>
          <div className="footer-links">
            <a href="https://washington.org/" target="_blank" rel="noreferrer">Official visitor guide</a>
            <a href="https://www.nps.gov/nama/" target="_blank" rel="noreferrer">National Mall info</a>
            <a href="https://www.wmata.com/" target="_blank" rel="noreferrer">Metro</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
