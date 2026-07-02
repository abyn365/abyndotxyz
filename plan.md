
---

# Music Page UI/UX Overhaul & Feature Expansion

I want to significantly improve the overall design and functionality of the Last.fm music pages. The goal is to make them feel like a polished modern music dashboard rather than just a list of statistics.

## General Requirements

* Keep the existing design language and animations.
* Maintain responsiveness across desktop, tablet, and mobile.
* Do **not** introduce horizontal page scrolling.
* Any carousel, slider, or horizontally scrolling component must be clipped to the viewport (no overflowing outside the page).
* Follow accessibility best practices (contrast, keyboard navigation, ARIA labels where appropriate).

---

# UI Improvements

## Profile Header

Improve the top profile section.

### Social Links

Currently the social icons and text leave a large amount of empty space on the right.

Instead:

* Center the social links vertically.
* Improve spacing between icon and text.
* Balance the layout so the header feels visually even.
* Make the profile information feel more compact and intentional.

---

## Theme Improvements

### Light Theme

Improve readability by increasing contrast.

Examples:

* Darker text colors
* Better muted text color
* Slightly stronger borders
* Better separation between cards

The current light theme feels washed out.

---

### Accent Colors

The current blue accent feels out of place.

Instead:

### Dark Mode

Try a neutral accent such as:

```
#EDEDED
```

or another tasteful monochrome accent that better fits the site's aesthetic.

### Light Mode

Invert the idea:

Use a darker accent color instead of blue.

The goal is a clean monochrome design rather than a bright blue highlight.

---

## Custom Scrollbar

Create a custom scrollbar for the entire website.

Requirements:

* Matches the site's design.
* Thin.
* Rounded.
* Animated on hover.
* Works in Chromium and Firefox.
* Supports both light and dark themes.

---

# Top Tracks Redesign

Instead of displaying Top Tracks as one long vertical list:

Convert it into a horizontal carousel.

Requirements:

* Previous / Next buttons
* Mouse wheel support
* Touch gestures on mobile
* Swipe support
* Keyboard arrow support
* Smooth animations
* Snap scrolling

Very important:

The carousel must never overflow the viewport.

If cards would render outside the visible area, clip them instead of expanding page width.

---

# Music Dashboard Redesign

Completely redesign the music statistics section into a modern analytics dashboard.

Think:

* Spotify Wrapped
* Apple Music Replay
* Steam profile analytics
* GitHub contribution dashboard

rather than simple lists.

---

# New Statistics Cards

Use all available Last.fm endpoints to create as many meaningful statistics as possible.

Examples:

```
6,095
Streams

15.4K
Minutes Listened

257
Hours Listened

1.4K
Tracks

1.2K
Albums

1K
Artists

218
Average Plays Per Day

Longest Listening Streak

Account Age

Most Active Listening Day

Average Track Length

Average Album Plays

Average Artist Plays

Favorite Listening Period

Current Listening Status

Total Scrobbles

Registered Since

Weekly Growth

Monthly Growth
```

Add more useful metrics wherever possible, but avoid displaying redundant or meaningless numbers.

---

# Listening Clock

Create a visual "Listening Clock."

Idea:

Display listening activity across the 24-hour day.

Possible implementations:

* Polar Area Chart (preferred)
* Radial Bar Chart
* Circular Heatmap

The chart should immediately show:

* When the user usually listens to music.
* Peak listening hours.
* Quiet hours.

If necessary, compute this from `user.getRecentTracks`.

---

# Charts & Visualizations

Introduce modern data visualizations throughout the page.

Possible charts include:

## Listening Clock

24-hour polar chart.

---

## Top Artists Distribution

Donut chart showing play share.

---

## Top Albums Distribution

Donut chart.

---

## Track Popularity

Horizontal bar chart.

---

## Listening History

Line chart showing listening trends over time.

---

## Weekly Activity

Heatmap similar to GitHub contributions.

---

## Artist Diversity

Treemap or packed bubbles showing artist distribution.

---

# Richer Last.fm Integration

Expand API usage beyond the current implementation.

In addition to the existing endpoints, utilize data from:

* `user.getInfo`
* `user.getTopTracks`
* `user.getTopArtists`
* `user.getTopAlbums`
* `user.getRecentTracks`
* `user.getWeeklyTrackChart`
* `user.getWeeklyArtistChart`
* `user.getWeeklyAlbumChart`

Leverage these endpoints to derive richer analytics rather than simply displaying raw API responses.

Examples of derived insights:

* Estimated listening time (using track durations where available)
* Listening frequency
* Daily averages
* Weekly trends
* Artist diversity
* Album diversity
* Favorite genres (if inferable)
* Peak listening hours
* Current listening status
* Account age
* Listening streaks (where feasible)
* Percentage share of top artists/albums/tracks

---

# Animations

Enhance the overall experience with tasteful motion.

Ideas:

* Animated counters
* Smooth card hover effects
* Scroll-triggered reveals
* Chart transitions
* Loading skeletons
* Animated number changes when switching time periods

Animations should feel polished and subtle, never distracting.

---

# Mobile Experience

Mobile should not simply be a compressed desktop layout.

Instead:

* Optimize spacing specifically for phones.
* Use swipeable sections where appropriate.
* Stack dashboard cards intelligently.
* Ensure charts remain readable.
* Avoid horizontal page scrolling entirely.
* Keep touch targets large and accessible.

---

# Performance

While adding these features:

* Keep bundle size reasonable.
* Lazy-load heavy charts.
* Memoize expensive computations.
* Avoid unnecessary API requests.
* Cache derived analytics where appropriate.
* Maintain smooth performance even with large Last.fm histories.

---

# Design Goal

The final result should resemble a premium music analytics dashboard inspired by Spotify Wrapped, Apple Music Replay, GitHub Insights, and modern SaaS dashboards, while staying consistent with the existing visual identity of the website. Prioritize clean layouts, meaningful analytics, excellent responsiveness, and polished interactions over simply adding more components.
