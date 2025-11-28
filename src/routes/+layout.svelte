<script>
  import { ModeWatcher } from "mode-watcher";
  let { children } = $props();
  import "../app.css";
</script>

<ModeWatcher />
{@render children()}
