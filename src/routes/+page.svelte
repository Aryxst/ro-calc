<script lang="ts">
  import { Button } from "$lib/components/ui/button";
  import { Checkbox } from "$lib/components/ui/checkbox";
  import { Input } from "$lib/components/ui/input";
  import * as Select from "$lib/components/ui/select";
  import { Separator } from "$lib/components/ui/separator";
  import * as Pagination from "$lib/components/ui/pagination";
  import * as RobloxAPITypes from "$lib/types/roblox-api.types";
  import { page } from "$app/state";
  import { AssetTypeEnum, ITEMS_PER_PAGE_OPTIONS } from "$lib/constants";
  import { onMount } from "svelte";

  let userId = $state<number>();
  let assetType = $state<keyof typeof AssetTypeEnum>("PLUGIN");
  let itemsPerPage = $state<number>(20);
  let currentPage = $state<number>(1);

  const avatarInfo = $derived.by<Promise<RobloxAPITypes.ThumnailAPIResponse>>(
    async () => {
      const response = await fetch(
        `https://thumbnails.roproxy.com/v1/users/avatar?userIds=${userId}&size=420x420&format=Png&isCircular=false`
      );
      return response.json();
    }
  );

  const userInfo = $derived.by<Promise<RobloxAPITypes.UserAPIResponse>>(async () => {
    const response = await fetch(`https://users.roproxy.com/v1/users/${userId}`);
    return response.json();
  });

  let inventoryInfo = $derived.by<Promise<RobloxAPITypes.InventoryAPIResponse>>(
    async () => {
      const response = await fetch(
        `https://www.roproxy.com/users/inventory/list-json?assetTypeId=${AssetTypeEnum[assetType]}&cursor=&itemsPerPage=1000&pageNumber=1&userId=${userId}`
      );
      return response.json();
    }
  );

  type ActiveFiltersType = {
    productName: string;
    productPrice: { min: number | null; max: number };
    creatorName: string;
    excludeOffsale: boolean;
  };

  type FilterKey = keyof ActiveFiltersType;

  type FilterDefinition = {
    name: FilterKey;
    type: "comparison" | "condition";
    fn: (item: RobloxAPITypes.ItemElement) => boolean;
  };

  let activeFilters = $state<ActiveFiltersType>({
    productName: "",
    productPrice: { min: null, max: Infinity },
    creatorName: "",
    excludeOffsale: false,
  });

  const filterDefinitions: FilterDefinition[] = [
    {
      name: "productName",
      type: "comparison",
      fn: item =>
        !!activeFilters.productName
          ? item.Item.Name.toLowerCase().includes(activeFilters.productName.toLowerCase())
          : true,
    },
    {
      name: "productPrice",
      type: "comparison",
      fn: item =>
        item.Product.PriceInRobux >= activeFilters.productPrice.min! &&
        item.Product.PriceInRobux <= activeFilters.productPrice.max,
    },
    {
      name: "creatorName",
      type: "comparison",
      fn: item =>
        !!activeFilters.creatorName
          ? item.Creator.Name.toLowerCase().includes(
              activeFilters.creatorName.toLowerCase()
            )
          : true,
    },
    {
      name: "excludeOffsale",
      type: "condition",
      fn: item => item.Product.IsForSale,
    },
  ];

  const filterFn = (item: RobloxAPITypes.ItemElement) => {
    const filterResult: boolean[] = [];

    for (const [key] of Object.entries(activeFilters)) {
      activeFilters[key as FilterKey]
        ? filterResult.push(
            filterDefinitions
              .find(filter => filter.name === (key as FilterKey))
              ?.fn(item)!
          )
        : filterResult.push(true);
    }
    return filterResult.every(Boolean);
  };

  onMount(() => {
    const id = page.url.searchParams.get("id");
    if (id) userId = +id;
  });
</script>

<main class="p-4">
  <div class="space-y-2">
    <form
      class="flex gap-2"
      onsubmit={event => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        userId = +formData.get("id")!;
      }}
    >
      <Input
        class="max-w-xs"
        name="id"
        type="number"
        placeholder="User ID"
        required
        value={userId}
      />
      <Select.Root type="single" bind:value={assetType}>
        <Select.Trigger class="w-[180px]">
          {assetType}
        </Select.Trigger>
        <Select.Content>
          {#each Object.entries(AssetTypeEnum).sort( ([a], [b]) => a.localeCompare(b) ) as [key]}
            <Select.Item value={key}>{key}</Select.Item>
          {/each}
        </Select.Content>
      </Select.Root>
      <Select.Root
        type="single"
        bind:value={() => String(itemsPerPage), value => (itemsPerPage = Number(value))}
      >
        <Select.Trigger class="w-[180px]">
          {itemsPerPage}
        </Select.Trigger>
        <Select.Content>
          {#each ITEMS_PER_PAGE_OPTIONS as value}
            <Select.Item value={String(value)}>{value}</Select.Item>
          {/each}
        </Select.Content>
      </Select.Root>
      <Button type="submit">Go</Button>
    </form>
    <div class="grid w-fit grid-cols-2 gap-2">
      <Input
        class="max-w-xs"
        type="text"
        placeholder="Product Name"
        bind:value={activeFilters.productName}
      />
      <Input
        class="max-w-xs"
        type="text"
        placeholder="Creator Name"
        bind:value={activeFilters.creatorName}
      />
      <Input
        class="max-w-xs"
        type="number"
        placeholder="Min"
        bind:value={activeFilters.productPrice.min}
      />
      <Input
        class="max-w-xs"
        type="number"
        placeholder="Max"
        bind:value={() => activeFilters.productPrice.max,
        value => (activeFilters.productPrice.max = value || Infinity)}
      />
    </div>
    <div>
      {#each filterDefinitions as { name, type }}
        {#if type === "condition"}
          <Checkbox bind:checked={activeFilters[name] as unknown as boolean} />
          <label for={name}>{name}</label>
        {/if}
      {/each}
    </div>
  </div>
  {#if userId}
    <Separator class="my-4" />
    {#await Promise.all([inventoryInfo, userInfo, avatarInfo])}
      <p>Loading</p>
    {:then [inventory, user, avatar]}
      {@const items = inventory.Data.Items.filter(
        ({ Creator, Product }) =>
          Creator.Id != userId && !!Product && !!Product.PriceInRobux
      )}
      {@const filteredItems = items.filter(filterFn)}
      <h1>{user.name}({user.displayName})</h1>
      <img
        src={avatar.data[0].imageUrl}
        alt="{user.name}'s avatar"
        width="300"
        height="300"
      />
      <ul>
        <li>
          Robux Spent:
          <span>
            {items.reduce(
              (sum, { Product }) => sum + Product.PriceInRobux,
              0
            )}({filteredItems.reduce(
              (sum, { Product }) => sum + Product.PriceInRobux,
              0
            )})
          </span>
        </li>
        <li>
          Total Bought:
          <span>
            {items.length}
          </span>
        </li>
      </ul>
      {@const totalPages = Math.ceil(filteredItems.length / itemsPerPage)}
      {@const startIndex = (currentPage - 1) * itemsPerPage}
      {@const endIndex =
        currentPage === totalPages ? filteredItems.length : startIndex + itemsPerPage}
      <Pagination.Root
        count={filteredItems.length}
        perPage={itemsPerPage}
        bind:page={currentPage}
      >
        {#snippet children({ pages, currentPage })}
          <span class="text-muted-foreground"
            >Showing <span class="font-semibold text-foreground"
              >{startIndex === 0 ? 1 : startIndex}</span
            >
            to
            <span class="font-semibold text-foreground">{endIndex}</span>
            of
            <span class="font-semibold text-foreground">{filteredItems.length}</span> Entries</span
          >
          <Pagination.Content class="mt-2">
            <Pagination.Item>
              <Pagination.PrevButton />
            </Pagination.Item>
            {#each pages as page (page.key)}
              {#if page.type === "ellipsis"}
                <Pagination.Item>
                  <Pagination.Ellipsis />
                </Pagination.Item>
              {:else}
                <Pagination.Item>
                  <Pagination.Link {page} isActive={currentPage === page.value}>
                    {page.value}
                  </Pagination.Link>
                </Pagination.Item>
              {/if}
            {/each}
            <Pagination.Item>
              <Pagination.NextButton />
            </Pagination.Item>
          </Pagination.Content>
        {/snippet}
      </Pagination.Root>
      <ul class="my-4 flex flex-wrap justify-center gap-4">
        {#each filteredItems.slice(startIndex, endIndex) as item}
          {@const { Item, Product, Thumbnail, Creator } = item}
          <li class="max-w-[150px]">
            <div>
              <a href={Item.AbsoluteUrl} rel="noopener noreferrer">
                <img
                  src={Thumbnail.Url.replace(/110/g, "150")}
                  alt="{Item.Name}'s Thumbnail"
                  width="150"
                  height="150"
                  loading="lazy"
                />
              </a>
            </div>
            <div title={Item.Name}>
              <a
                class="line-clamp-2 overflow-ellipsis"
                href={Item.AbsoluteUrl}
                rel="noopener noreferrer"
              >
                {Item.Name}
              </a>
            </div>
            <div class="truncate text-sm">
              <span>By</span>
              <a
                class="inline truncate font-bold hover:underline"
                href={Creator.CreatorProfileLink}
                rel="noopener noreferrer"
              >
                {Creator.Name}
              </a>
            </div>
            <div>
              Price:
              <span>
                {!Product.IsForSale && Product.PriceInRobux
                  ? `Not for sale(${Product.PriceInRobux} Robux)`
                  : `${Product.PriceInRobux} Robux`}
              </span>
            </div>
          </li>
        {/each}
      </ul>
    {:catch error}
      <p>An error occured!</p>
      <pre>{error}</pre>
    {/await}
  {/if}
</main>
