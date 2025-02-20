<script lang="ts">
  export let title: string;
  export let subtitle: string;
  export let buttonText: string = 'Saiba Mais';
  export let backgroundColor: string = 'bg-primary';
</script>

<section class={`hero min-h-[60vh] ${backgroundColor}`}>
  <div class="hero-content text-center">
    <div class="max-w-md">
      <h1 class="text-5xl font-bold">{title}</h1>
      <p class="py-6">{subtitle}</p>
      <button class="btn btn-primary">{buttonText}</button>
    </div>
  </div>
</section> 