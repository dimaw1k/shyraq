# Kinescope Setup

## 1. Video workflow

Videos are hosted in Kinescope. YouTube is not part of the Shyraq lesson flow.

Admin/content manager workflow:

1. Upload the lesson video to Kinescope.
2. Copy the Kinescope video ID.
3. Create a Shyraq lesson with the video ID and the exact video duration.
4. Attach a lesson test.
5. Publish the lesson.

## 2. Environment

Server-side Kinescope management variables:

- `KINESCOPE_API_TOKEN`
- `KINESCOPE_WORKSPACE_ID`

These are placeholders until the production Kinescope workspace is configured.

## 3. Player

Shyraq uses the official React player package.

The player reports `onTimeUpdate({ currentTime })` events. The client converts playback into time ranges and the server merges them with previously stored ranges.

## 4. Why time ranges

Do not calculate completion from only the latest playback position.

Example:

`00:00–10:00 + 20:00–30:00 = 20 minutes watched`

Jumping directly to 50:00 must not create fake 83% completion for a 60-minute video.

## 5. 85% gate

Default:

`required_watch_percent = 85`

The server calculates:

`unique watched seconds / video duration`

When the threshold is reached:

`test_unlocked = true`

Every test-open and test-submit request re-checks this state server-side.

## 6. Important limitation

This is a learning-progress control, not DRM or an unbreakable anti-cheat system. A determined user can potentially spoof client telemetry. Later, the platform can add stronger verification if the product requires it.